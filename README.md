# SignaturenDruck

This is a Electron application to print shelfmarks read from a `.dnl`-file. It displays shelfmarks from the file in a table like structure. You can then select and print the shelfmarks you like.

The printing process creates two `.pdf`-files (each for one size) and proceeds to print them silently via Foxit Reader.



To use this application you'll need to install [Foxit Reader v6.2.3.0815](http://cdn01.foxitsoftware.com/pub/foxit/reader/desktop/win/6.x/6.2/enu/FoxitReader623.815_enu_Setup.exe) on your computer.

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/EliDeh/SignaturenDruck
# Go into the repository
cd SignaturenDruck/signaturenDruck
# Install dependencies
npm install
# Run the app
npm start
```

The app creates the directory `C:\\Export` and stores the `config.json` in it.

In the `config.json` you can change the printers, pdf-filenames and the labelsizes.

The devMode disables the actual printing, shows the else hidden label windows and creates then the 2 pdf-files.

**Clone and run for a quick way to see Electron in action.**

To build the app for win7/10 32bit:

```bash
npx electron-builder --win --ia32
```

## License

[CC0 1.0 (Public Domain)](LICENSE.md)
