/**
 *@fileOverview
 *@version 1.0
 *
 * @namespace ui.detailrow
 * @description  jQuery UI plugin to toggle the display of a detail row in a table structure.
 * Fetches the detail row HTML through an AJAX callback and displays the return in a newly attached row.
 * If the detail row has been fetched already and is present in the DOM then no AJAX call is fired again, the row display is simply toggled.
 *
 * The selector selects the container which holds/will hold the elements which will display/toggle detail rows. For example, an interactive report with a static id set. The triggering elements are defined by the classes specified in the options object (toggle.classes)
 * @example
 * Enable detailrow on a region with static id "departments". When the togle is clicked an ajax callback process on the page called "get_detail_row" will be used to generated the HTML for the detail row. When the ajax call has finished the custom callback function will execute.
 * This region is an interactive report. It has a column called "SHOW_DETAILS" and it has an HTML expression:
 * <div data-dtr-dept-id="#ID#" data-some-other-thing="xyz" class="dtr-detailtoggle dtr-closed"></div>
 *
 * data-dtr- indicates use of the data prefix property. This attribute's value will be used in the ajax call
 * apex.jQuery('#departments').detailrow({ajax: {process: "get_detail_row", callback: function(pObj){console.log('callback occured, object passed: ', pObj);}}})
 */
(function ($, undefined) {
  "use strict"
$.widget('ui.detailrow',
  { 
    /**
     * @name ui.detailrow#options 
     * @description Options defineable 
     * {Object} toggle Object with settings for the toggling element
     * {Object} toggle.classes Classes used for the toggle element
     * {String} [toggle.classes.toggle="dtr-detailtoggle"] class used to identify the element which toggles the visibility of the detail row. This class should be assigned to the elements generated and have to toggle the detailrow within context of the given selector (=container)
     * {String} [toggle.classes.open="dtr-open"] class indicating the detail row is opened
     * {String} [toggle.classes.close="dtr-closed"] class indicating the detail row is closed
     * {Array} [toggle.data=[]] array with data attribute names to be used in the ajax call, their indices define the x##-parameter used eg:["dept-id"]
     * {String} [toggle.dataPrefix="dtr"] data attribute prefix to determine which data attributes to use in the ajax call eg: "data-dtr-dept-id" - set as undefined if you want to use the data array. Prefix has precedence otherwise.
     * {Function} [toggle.click]
     *
     * {Object} detail Object with settings for the detail row element
     * {Object} detail.classes Classes used on the detail row
     * {String} [detail.classes.row="dtr-detail"] Class assigned to the actual row element serving as the detail row container
     * {String} [detail.classes.content="dtr-detailContent"] Class assigned to the content container inside the row element (DIV)
     *
     * {Object} loader Object with settings for the loader indicator, which is used when the ajax call to retrieve the data is taking long
     * {Number} [loader.delay=300] Delay in ms after which a loading icon is shown in the detail row
     * {String} [loader.class="dtr-loader"] class assigned to the loading icon element
     *
     * {Object} ajax Object with settings for the ajax callback to retreieve the detail html
     * {Boolean} ajax.plugin=false is the ajax call used in an apex plugin or not. If true, apex.server.plugin is used, else apex.server.process
     * {String} ajax.process the process name to call out to. This could be a callback process on a page or an application process, or in case of a plugin the ajax identifier.
     * {Object} [ajax.data={}] Object with keys and values with which to extend the data object passed to the ajax call
     * {Object} [ajax.options={}] Options object with which to extend the options object passed to apex.server.process/plugin
     * {Function} [ajax.callback] Function to call when the ajax callback has returned. The context (this) is empty, but a data object with two keys is provided as parameter {data, element}. The first is the data returned from the ajax call, second is the content element the data will be appended to. It is possible to manipulate the passed data. The returned data will then be used as the content for the detail row. No return (or undefined) means the returned data as-is will be used.
     */
    options: {
      toggle : { classes: { toggle : "dtr-detailtoggle"
                          , open   : "dtr-open"
                          , close  : "dtr-closed"
                          }
               , data   : []
               , dataPrefix : "dtr"
               , click  : null
               }
    , detail : { classes: { row     : "dtr-detail"
                          , content : "dtr-detailContent"
                          }
               }
    , loader : { delay: 300 , class: "dtr-loader" }
    , ajax   : { plugin   : false
               , process  : null
               , data     : {}
               , options  : {}
               , callback : null
               }
    }
    ,
    /**
     * @name ui.detailrow#_create
     * @function
     * @private
     * @description Initialisation of the widget. Will assign the click handler for the detail row toggles
     */
    _create: function () {
      var uiw = this;
      $(uiw.element).on( "click.dtr", "." + uiw.options.toggle.classes.toggle, function(event){ uiw._toggle.call( uiw, event.target ); });
    }
  , 
    /**
     * @name ui.detailrow#__constructAjaxData
     * @function
     * @private
     * @description constructs the object with all key-values to be used as the data object in an ajax call
     * @param {Array} dataAttributes an array with keys matching the data attributes for which to retrieve the value
     * @param {String} prefix the prefix to use 
     * @param {Object} data Data object retrieved from the toggle element, ie an object with key-values matching the data attributes (sans data-)
     * @param {Object} staticData an object with key-values to append to the data object
     * @return {Object} the constructed data object to be used in the ajax call
     */
    __constructAjaxData : function ( dataAttributes, prefix, data, staticData ) {
      var lParams = {};
      var x = 1;
      //alternative: search for all data attributes which have dtr in their prefix - less configuration on plugin
      if ( prefix ) {
        // concern: will the order of keys in data() match the dom order?
        Object.keys ( data ).forEach(function(k){
          if ( k.search( prefix ) !== -1 ) {
            lParams[ "x" + ("00" + (x++)).slice(-2) ] = data[k];
          };
        });
      } else {
        // by default, use the passed in toggle data array to retrieve the values
        dataAttributes.forEach(function(param, i){
          lParams[ "x" + ("00" + (i+1)).slice(-2) ] = data[param];
        });
      };

      // extend the built data options with static data options given in the ajax object
      $.extend(lParams, staticData);

      return lParams;
    }
  , 
    /**
     * @name ui.detailrow#__getjqXHR
     * @function
     * @private
     * @description gets the jqXHR object for the ajax call
     * @param {Boolean} isPlugin indicates whether the ajax call is for an apex plugin or not
     * @param {String} processId the processname to call. In case of the plugin this would be the ajax identifier 
     * @param {Object} params object with values to pass on to the ajax call (eg x01, x02)
     * @param {Object} options options to pass on to the call
     * @return {Object} the jqXHR object
     */
    __getjqXHR : function ( isPlugin, processId, params, options ) {
      if ( isPlugin ) {
        return apex.server.plugin(
            processId
          , params
          , options
          );
      } else {
        return apex.server.process(
            processId
          , params
          , options
          );
      };
    }
  ,
    /**
     * @name ui.detailrow#_newDetailRow
     * @function
     * @private
     * @description constructs and appends a new row. Will perform an ajax call to retrieve the html, create a new row, and when ajax finishes append the returned html in this row. The ajax callback can be modified by the user before being appended
     * @param {widget instance} uiw the widget instance
     * @param {DOMElement} pTable the table element in which the toggle element resides
     * @param {DOMElement} pTr the row element in which the toggle element resides
     * @param {jQuery Object} pRowToggle the jquery object of the toggle element
     */
    _newDetailRow : function ( uiw, pTable, pTr, pRowToggle ) {
      var lNewRow  = $("<tr>").addClass(uiw.options.detail.classes.row);
      var lNewCell = $("<td>").attr("colspan", pTr.cells.length);
      var lLoader  = $("<div></div>").addClass(uiw.options.loader.class);
      var lContent = $("<div></div>").addClass(uiw.options.detail.classes.content).hide();
      $(pTable.rows[pTr.rowIndex]).after( lNewRow.html(lNewCell.append(lContent)) );

      // initiate the delay for the loader icon. It will only show if the callback takes longer than specified delay
      var lDelay = setTimeout(function(){ lNewCell.prepend(lLoader) }, uiw.options.loader.delay);

      var lParams = uiw.__constructAjaxData ( uiw.options.toggle.data, uiw.options.toggle.dataPrefix, pRowToggle.data(), uiw.options.ajax.data );

      // by default we're expecting HTML back, not JSON, so let's override.
      // user can override again by setting the option...
      var lOptions = { dataType: "text" };
      $.extend(lOptions, uiw.options.ajax.options);

      // get the detail line
      var ajax = uiw.__getjqXHR ( uiw.options.ajax.plugin, uiw.options.ajax.process, lParams, lOptions );

      ajax.done(function(data){
        var lData;
        clearTimeout(lDelay);

        lLoader.remove();

        if ( uiw.options.ajax.callback !== undefined && $.isFunction(uiw.options.ajax.callback) ) {
          // call the callback. Context is empty, but provide a data object with two keys
          // first is the data returned from the ajax call, second is the content element the data will be appended to.
          // no handling is provided for eventual data changes - yet. We should test if a return is made and if yes, set the data to this return
          lData = uiw.options.ajax.callback.call(null, {data: data, element: lContent});
        };
        lData = lData===undefined ? data : lData;

        //add html and slide it open
        lContent.html(lData).slideDown();
      });
    }
  , 
    /**
     * @name ui.detailrow#_toggleDetailRow
     * @function
     * @private
     * @description toggles an existing detail row. Contains the slidedown/up mechanics
     * @param {widget instance} uiw the widget instance
     * @param {DOMElement} pTable the table element in which the toggle element resides
     * @param {DOMElement} pTr the row element in which the toggle element resides
     */
    _toggleDetailRow : function ( uiw, pTable, pTr ) {
      // toggle the detail line which is already present in DOM
      var lRow = $(pTable.rows[pTr.rowIndex+1]);
      // if detail is visible: slide the content up and then hide the detail row
      // if not visible: show the detail row and then slide the content down
      if ( lRow.is(":visible") ) {
        lRow.find("."+uiw.options.detail.classes.content).slideToggle({complete: function(){
          lRow.toggle();
        }});
      } else {
        lRow.toggle({duration: 0, complete: function(){
          lRow.find("."+uiw.options.detail.classes.content).slideToggle();
        }});
      };
    }
  ,
    /**
     * @name ui.detailrow#_toggle
     * @function
     * @private
     * @description toggle the detailrow when a toggle element has been clicked. Fires the click callback when defined
     * @param {DOMElement} pRowToggle the element which has been clicked
     */
    _toggle: function ( pRowToggle ) {
      var uiw = this;
      var $rowToggle = $(pRowToggle);
      var lTr = $rowToggle.closest('tr').get(0);
      var lTable = $rowToggle.closest('table').get(0);
      var lDetailFetch = false;

      //indien rowindex niet de laatste rij is OF de classname van de tr niet detail is (==opnieuw openen)
      // if rowindex is not the last row
      // OR the next row's classname does not have the detail row class
      //if ( lTr.rowIndex === lTable.rows.length-1 || ! $(lTable.rows[lTr.rowIndex+1]).hasClass(uiw.options.detail.classes.row) ) {
      //if toggled element is closed and the next row is not a detail row -> fetch the detailrow
      if ( $rowToggle.hasClass(uiw.options.toggle.classes.close) && ! $(lTable.rows[lTr.rowIndex+1]).hasClass(uiw.options.detail.classes.row) ) {
        uiw._newDetailRow( uiw, lTable, lTr, $rowToggle );
      } else {
        uiw._toggleDetailRow( uiw, lTable, lTr );
      };

      //finally, toggle the open and close classes to indicate the new state of the detail row
      $rowToggle.toggleClass(uiw.options.toggle.classes.open + ' ' + uiw.options.toggle.classes.close);

      //if a click callback has been defined fire it
      // the context is the clicked rowtoggle
      // param 1 is a boolean indicating if the detail is now opened or not
      // param 2 is a boolean indicating if the detail is newly fetched or not
      if ( uiw.options.toggle.click !== undefined && $.isFunction(uiw.options.toggle.click) ) {
        var newDetailState = $rowToggle.hasClass(uiw.options.toggle.classes.open);
        uiw.options.toggle.click.call(pRowToggle, $rowToggle.hasClass(uiw.options.toggle.classes.open), lDetailFetch);
      };
    }
  })
})(apex.jQuery);