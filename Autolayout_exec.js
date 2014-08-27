// Part of Auto Layout
// https://github.com/tlindner/Auto-Layout/wiki

var myParameters = [];

var myScript = app.activeScript;

app.scriptPreferences.enableRedraw = false;
app.scriptPreferences.userInteractionLevel = UserInteractionLevels.interactWithAlerts
app.doScript(File(myScript.path + "/" + "Autolayout.js"), ScriptLanguage.javascript, myParameters, UndoModes.AUTO_UNDO, "Auto Layout");
app.scriptPreferences.enableRedraw = true;
app.scriptPreferences.userInteractionLevel = UserInteractionLevels.interactWithAll;
