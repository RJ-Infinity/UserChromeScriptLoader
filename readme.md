# UserChromeScriptLoader thing

only tested on firefox 110.0 (64-bit)

## to install you unzip and add some symlinks to the firefox installation

> at `C:\Program Files\Mozilla Firefox`(or where firefox is installed)`\defaults\pref`
> 
> a new symlink `config-prefs.js`
> 
> (windows commands example) providing you are in the diriectory for this git
> ```bat
> mklink "C:\Program Files\Mozilla Firefox\defaults\pref\config-prefs.js" ".\config-prefs.js"
> ```

> at `C:\Program Files\Mozilla Firefox`(or where firefox is installed)
> 
> a new symlink `configRJ1.js`
> 
> (windows commands example) providing you are in the diriectory for this git
> ```bat
> mklink "C:\Program Files\Mozilla Firefox\configRJ1.js" ".\configRJ1.js"
> ```

> at `C:\Users\`[username]`\AppData\Roaming\Mozilla\Firefox`
> 
> a new symlink `RJAutoConfig.json`
> 
> (windows commands example) providing you are in the diriectory for this git
> ```bat
> mklink "C:\Users\%username%\AppData\Roaming\Mozilla\Firefox\RJAutoConfig.json" ".\RJAutoConfig.json"
> ```

> at `C:\Users\`[username]`\AppData\Roaming\Mozilla\Firefox`
> 
> a new directory symlink `RJAutoConfigFiles`
> 
> (windows commands example) providing you are in the diriectory for this git
> ```bat
> mklink /D "C:\Users\%username%\AppData\Roaming\Mozilla\Firefox\RJAutoConfigFiles" ".\RJAutoConfigFiles"
> ```

## how it works

the `config-prefs.js` makes regesters the `configRJ1.js` file as a file to run on startup then that loads the `RJAutoConfig.json` and finds the files in the `RJAutoConfigFiles` directory

much of this knowledge comes from https://www.userchrome.org and https://github.com/alice0775/userChrome.js