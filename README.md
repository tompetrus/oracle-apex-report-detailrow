# Report Detail Row

Plugin Details:
- Name: Report Detail Row
- Code: TP.DA.DETAILROW
- Version: v2.0
- Apex compatibility: 5

This plugin allows an easy way to configure displaying a detail row in a report. It requires you to properly initialize a column in these reports so it can serve as a toggle for the detail row.
When toggled, a new row is created underneath the row with the toggle. An ajax call is then made, either to a process or to the PLSQL block defined in the plugin's DA. This process or block should then return html through `htp.p` and this html will be put in the detail row. The new row will automatically consist of one row with one cell, and this cell will colspan as many columns as there currently are in the report.
To get the correct information in the process you have to set up your detailrow correctly. For example, in a report with rows for each department you'd want to show a detailrow with all the employees. This means you'd need a way to pass along the department id to the PLSQL process retrieving all employees. This info can be passed along by defining data attributes which use the `dtr` prefix (`data-dtr-...`). These attributes will then be mapped, in order, to the x01-x10 attributes which can be used in the ajax process.

## To use:

1. install the plugin in the shared components of your application
2. create a dynamic action on the page of type "Page Load"
3. as a true action, select the "Report Detail Row" action, found under "Component"
4. Adjust the settings if you require so. Choose whether to use a callback defined in the plugin or use a page or application process. Be sure to assign an affected region (=the report).
5. Add or modify a column in your report, and edit the "HTML Expression" property. Add an element, provide it with the detailtoggle and closed class (should match the settings in the DA!) and assign data-dtr attributes with the data which should be passed along. eg `<div data-dtr-dept-id="#ID#" class="dtr-detailtoggle dtr-closed"></div>`

## To ensure compatibility with version 1.0: 

You can install this new version and it will 'upgrade' (overwrite) the version 1.0 plugin. Meaning that dynamic actions which have been using this plugin are also upgraded.

## Changes over v1:

- Updated files: images moved to images folder, removed PLUGIN_PREFIX from CSS. 