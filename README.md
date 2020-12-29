unity-activate
===

A tool to automate the manual activation of unity license using puppeteer.

Inspired by https://github.com/MizoTake/unity-license-activate.

[![npm](https://img.shields.io/npm/v/unity-activate)](https://www.npmjs.com/package/unity-activate)
![license](https://img.shields.io/npm/l/unity-activate)
![downloads](https://img.shields.io/npm/dy/unity-activate)
![release](https://github.com/mob-sakai/unity-activate/workflows/release/badge.svg)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

<br><br><br><br>

## Usage as a node module:

```sh
npm install unity-activate
```

```js
const { ActivatorOptions, Activator } = require('unity-activate');

(async () => {
    new Activator({
        file :'input.alf',
        username :'username',
        password :'password',
        serial :'serial_code',
        out :'output_dir',
      }).run();
})();
```

<br><br><br><br>

## Usage as a command-line utility:

```sh
# Installation:
npm install -g unity-activate
```

```sh
Usage:
  $ unity-activate [opts] <*.alf>

Activate Unity activation license file (Unity_v***.alf or Unity_lic.alf)
NOTE: If two-factor authentication is enabled, the verify code will be requested.

Options:
  -o, --out <dir>              Output ulf file to the specified directory (default: .)
  -u, --username <username>    Username (email) to login Unity (default: $UNITY_USERNAME)
  -p, --password <password>    Password to login Unity (default: $UNITY_PASSWORD)
  -s, --serial <serial>        Serial key to activate (default: $UNITY_SERIAL). If empty, activate as personal license.
NOTE: Unity Personal Edition is not available to companies or organizations that earned more than USD100,000 in the previous fiscal year.
 
  -d, --debug                  Run "headful" puppeteer (default: false)
  -h, --help                   Display this message 
  -v, --version                Display version number
```

<br><br>

### Step 1: Get a license request file

Create a license activation file and import license file by command.

```sh
# On Windows:
$ "C:\Program Files\Unity\Editor\Unity.exe" -batchmode -createManualActivationFile

# On macOS:
$ /Applications/Unity/Unity.app/Contents/MacOS/Unity -batchmode -createManualActivationFile
```

Or, with UnityHub (`Settings > License Management > MANUAL ACTIVATION > SAVE LICENSE REQUEST`).

![](https://user-images.githubusercontent.com/12690315/103255736-d4aa8380-49cd-11eb-9701-ff787e38a9f1.png)

<br><br>

### Step 2: Request a license (*.ulf)

Run `unity-activate` to download the `*.ulf` file.

```sh
# For personal license (with interaction):
$ unity-activate ***.alf
$   > enter the username and password
$ username: your@email.com
$ password: *****
...

# For personal license:
$ unity-activate --username your@email.com --password your_password ***.alf

# For professional license (with --serial option):
$ unity-activate --username your@email.com --password your_password --serial your_serial_code ***.alf

# Use environment variables instead of options:
$ export UNITY_USERNAME=your@email.com
$ export UNITY_PASSWORD=your_password
$ export UNITY_SERIAL=your_serial_code # If empty, activate as personal license.
$ unity-activate ***.alf
```

<br><br>

### Step 3: Activate your license 

Now that you have your license file, you can activate your Unity account by command.

```sh
# On Windows:
$ "C:\Program Files\Unity\Editor\Unity.exe" -batchmode -manualLicenseFile ***.ulf

# On macOS:
$ /Applications/Unity/Unity.app/Contents/MacOS/Unity -batchmode -manualLicenseFile ***.ulf
```

Or, with UnityHub.

![](https://user-images.githubusercontent.com/12690315/103255739-d70cdd80-49cd-11eb-9d18-62600a20085f.png)

<br><br><br><br>

## Contributing

### Issues

Issues are very valuable to this project.

- Ideas are a valuable source of contributions others can make
- Problems show where this project is lacking
- With a question you show where contributors can improve the user experience

### Pull Requests

Pull requests are, a great way to get your ideas into this repository.  

### Support

This is an open source project that I am developing in my spare time.  
If you like it, please support me.  
With your support, I can spend more time on development. :)

[![](https://user-images.githubusercontent.com/12690315/66942881-03686280-f085-11e9-9586-fc0b6011029f.png)](https://github.com/users/mob-sakai/sponsorship)

<br><br><br><br>

## License

* MIT

## Author

* ![](https://user-images.githubusercontent.com/12690315/96986908-434a0b80-155d-11eb-8275-85138ab90afa.png) [mob-sakai](https://github.com/mob-sakai) [![](https://img.shields.io/twitter/follow/mob_sakai.svg?label=Follow&style=social)](https://twitter.com/intent/follow?screen_name=mob_sakai) ![GitHub followers](https://img.shields.io/github/followers/mob-sakai?style=social)

## See Also

* GitHub page : https://github.com/mob-sakai/unity-activate
* Releases : https://github.com/mob-sakai/unity-activate/releases
* Issue tracker : https://github.com/mob-sakai/unity-activate/issues
* Change log : https://github.com/mob-sakai/unity-activate/blob/main/CHANGELOG.md
