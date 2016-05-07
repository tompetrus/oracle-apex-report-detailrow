FUNCTION dtr_render
( p_dynamic_action in apex_plugin.t_dynamic_action
, p_plugin         in apex_plugin.t_plugin 
)
RETURN apex_plugin.t_dynamic_action_render_result
IS
  l_result apex_plugin.t_dynamic_action_render_result;
  l_code                 VARCHAR2(4000);
  
  l_toggle_class         VARCHAR2(100) := coalesce(p_dynamic_action.attribute_01, 'dtr-detailtoggle');
  l_toggle_open_class    VARCHAR2(100) := coalesce(p_dynamic_action.attribute_02, 'dtr-open');
  l_toggle_close_class   VARCHAR2(100) := coalesce(p_dynamic_action.attribute_03, 'dtr-closed');
  l_data_attr_prefix     VARCHAR2(100) := coalesce(p_dynamic_action.attribute_04, 'dtr');
  l_detail_row_class     VARCHAR2(100) := coalesce(p_dynamic_action.attribute_05, 'dtr-detail');
  l_detail_content_class VARCHAR2(100) := coalesce(p_dynamic_action.attribute_06, 'dtr-detailContent');
  l_loader_delay         NUMBER(4)     := coalesce(p_dynamic_action.attribute_07, 300);
  l_ajax_type            VARCHAR2(100) := p_dynamic_action.attribute_08;
  l_process_name         VARCHAR2(100) := p_dynamic_action.attribute_09;
  l_crlf                 CHAR(2) := CHR(13)||CHR(10);
BEGIN
   IF apex_application.g_debug
   THEN
      apex_plugin_util.debug_dynamic_action(
         p_plugin         => p_plugin,
         p_dynamic_action => p_dynamic_action 
      );
   END IF;
   
   apex_javascript.add_library(
       p_name       => 'jquery.ui.detailRow'
     , p_directory  => p_plugin.file_prefix
     , p_key        => 'dtr-js'
   );
   
   apex_css.add_file(
       p_name       => 'jquery.ui.detailRow'
     , p_directory  => p_plugin.file_prefix
   );
  
  l_code := 
    'function(){ this.affectedElements.detailrow({' || l_crlf
    || 'toggle: { ' || l_crlf
    || '  classes: { ' 
    || apex_javascript.add_attribute('toggle', l_toggle_class)
    || apex_javascript.add_attribute('open', l_toggle_open_class)
    || apex_javascript.add_attribute('close', l_toggle_close_class, false, false)
    || ' }, ' || l_crlf
    || '  ' || apex_javascript.add_attribute('dataPrefix', l_data_attr_prefix, false, false)
    || '}, ' || l_crlf
    || 'detail: { ' || l_crlf
    || '  classes: { '
    || apex_javascript.add_attribute('row', l_detail_row_class)
    || apex_javascript.add_attribute('content', l_detail_content_class, false, false)
    || '  } ' || l_crlf
    || '}, ' || l_crlf
    || 'loader: { '
    || apex_javascript.add_attribute('delay', l_loader_delay, false, false)
    || '}, '
    || 'ajax: {'
    || apex_javascript.add_attribute('plugin', CASE WHEN l_ajax_type = 'PLUGIN' THEN true ELSE false END)
    || apex_javascript.add_attribute('process', CASE WHEN l_ajax_type = 'PLUGIN' THEN apex_plugin.get_ajax_identifier ELSE l_process_name END, false, false)
    || '}' || l_crlf
    || '});}';
  
  l_result.javascript_function := l_code;
  
  RETURN l_result;
END;


FUNCTION dtr_ajax
( p_dynamic_action in apex_plugin.t_dynamic_action
, p_plugin         in apex_plugin.t_plugin 
)
RETURN apex_plugin.t_dynamic_action_ajax_result
IS
  l_plsql_code  VARCHAR2(32767) := p_dynamic_action.attribute_10;
  l_result      apex_plugin.t_dynamic_action_ajax_result;
BEGIN
  apex_plugin_util.execute_plsql_code ( p_plsql_code => l_plsql_code );
  RETURN l_result;
END;