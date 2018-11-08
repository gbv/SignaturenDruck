# SignaturenDruck

This is a Electron application to print shelfmarks read from a `.dnl`-file. It displays shelfmarks from the file in a table like structure. You can then select and print the shelfmarks you like.

The printing process creates two `.pdf`-files (each for one size) and proceeds to print them silently via Foxit Reader.



To use this application you'll need to download the [PDFtoPrinter.exe](http://www.columbia.edu/~em36/pdftoprinter.html) and copy it to
```bash
C:\Program Files\PDFtoPrinter\
```

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

The app creates the directory `C:\\Export\\SignaturenDruck` and stores the `config.json` in it.

In the `config.json` you can change the printers, pdf-filenames and the labelsizes.

The devMode disables the actual printing. It will show the else hidden label-windows. The pdf-files can be found at: `C:\Users\YourUsername\AppData\Local\Programs\SignaturenDruck\tmp`

**Clone and run for a quick way to see Electron in action.**

To build the app for win7/10 32bit:

```bash
npm run build:exe
```

To build the app for win7/10 64bit:

```bash
npm run build:exe64
```

# Dokumentation

## Installation
Das Programm kann einfach mit der entsprechenden `.exe` (ia32 oder x64) installiert werden.  
Dazu genügt ein Doppelklick auf die `.exe`.  
Das Programm wird dann unter `C:\Users\USERNAME\AppData\Local\Programs\SignaturenDruck_neu` installiert.  
Auf dem Desktop des Nutzers wird eine Verknüpfung zum starten des SignaturenDrucks erzeugt.  
Nach erfolgreicher Installation startet das Program auch direkt.

## Arbeiten mit dem Programm
### Start des Programms
Es wird bei jedem Start des Programms geprüft ob die notwendigen Konfigurationsdateien und Ordner vorhanden sind, ist dies nicht der Fall so werden sie neu erzeugt. 
Dabei handelt es sich um:  

- `C:\Users\USERNAME\AppData\Local\Programs\SignaturenDruck_neu\tmp\`
- `C:\Export\SignaturenDruck\`
  - `./config.json`
  - `./Formate\`
    - `./thulb_gross.json`
    - `./thulb_klein.json`
    - `./thulb_klein_1.json`
  - `./FormateCSS\`
    - `./thulb_gross.css`
    - `./thulb_klein.css`
    - `./thulb_klein_1.css`

Sind diese Ordner/Dateien vorhanden so wird die geprüft ob die Datei die in der `config.json` unter `defaultPath` angegeben ist existiert.  
Ist dies der Fall dann werden die enthaltenen Daten geladen und angezeigt.
![Erfolgreiches laden der Daten](https://github.com/EliDeh/SignaturenDruck/blob/master/docu/imgs/erfolgreicherStart.png)  
Sollte dies nicht der Fall sein so wird dies in der Oberfläche angezeigt.
![Keine DefaultDatei vorhanden](https://github.com/EliDeh/SignaturenDruck/blob/master/docu/imgs/startOhneDefaultDatei.png)  

### Andere Datei auswählen

Mit einem Klick auf `Dateiauswahl` kann eine andere Datei auswählen aus der dann die Signaturen ausgelesen werden.

### Druckauswahl

Jede Signatur kann in ihrer Zeile mit einem Klick auf die Checkbox in der Spalte `Drucken` zum Druck ausgewählt werden. Die Auswahl kann einzeln erfolgen oder durch einen Klick auf den Splatenkopf `Drucken`. Dies kehrt die bisher getroffene Auswahl um, sollte also noch keine Signatur zum Druck ausgewählt worden sein, so werden durch einen Klick alle Signaturen der Tabelle zum Druck ausgewählt.  

In der Spalte `Anzahl` kann festegelegt werden wie oft die jeweilige Signatur gedruckt werden soll. Der Standardwert ist `1`.  

In der Spalte `Format` kann, wie der Name schon sagt, das Format ausgewählt werden mit dem die Signatur gedruckt werden soll. Vom gewählten Format ist abhängig nach welchem Schema der Zeilenumbruch erfolgt, wie die Zeilen angeordnet werden und welcher Drucker zum Druck verwendet wird.  

Der Druck der ausgewählten Signaturen erfolgt dann mit einem Klick auf die Schaltfläche `Drucken`. Anschließend wird eine Meldung über den erfolgreichen Druck ausgegeben.  

### Manuelles Anlegen

Der SignaturenDruck ermöglicht nicht nur den Druck von Signaturen aus einer Datei, sondern auch das erstellen von manuellen Signaturen. Mit einem Klick auf die Schaltfläche `Manuelles Anlegen` öffnet sich folgendes Fenster zur Eingabe:  
![Oberfläche manuelles Anlegen](https://github.com/EliDeh/SignaturenDruck/blob/master/docu/imgs/oberflaecheManuellesAnlegen.png)

Auf der linken Seite befinden sich die Eingabefelder der jeweiligen Zeilen und die Schaltflächen.  
Auf der rechten Seite befinden sich die Übersicht um welche manuelle Signatur es sich handelt, die Vorschau der Signatur, die Auswahl des Formats und die Option den Einzug zu entfernen.  

Nachdem eine Signatur eingetragen wurde, kann mit der Schaltfläche `Nächste` eine weitere Signatur eingetragen werden. Die Schaltfläche `Übernehmen und Beenden` speichert alle eingegebenen Signaturen ab, fügt sie im Hauptfenster der Tabelle hinzu und kehrt zu diesem Fenster zurück.  

Es besteht aber auch die Möglichkeit alle bisher eingetragenen manuellen Signaturen mit der Schaltfläche `Verwerfen und Beenden` gesammelt zu löschen.  

Das löschen einer einzelnen Signatur ist mit der Schaltfläche `löschen` möglich. Diese löscht immer die aktuell angezeigte Signatur.

Mit den Schaltflächen `Vorherige` und `Nächste` kann zwischen den bereits eingetragenen Signaturen navigiert werden. Ist man bei der ersten Signatur angelangt so ist die Schaltfläche `Vorherige` deaktiviert.

## License

[CC0 1.0 (Public Domain)](LICENSE.md)
