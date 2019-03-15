# SignaturenDruck

This is a Electron application to print shelfmarks read from a `.dnl`-file. It displays shelfmarks from the file in a table like structure. You can then select and print the shelfmarks you like.

The printing process creates `.pdf`-files (each per selectet format) and proceeds to print them via powershell and Adobe Acrobat Reader DC.  
The Acrobat Reader gets opened for a short time (~4 seconds) to print the files. It will close by itself except it was already open before.

To use this application you'll need to have the [Adobe Acrobat Reader DC](https://get.adobe.com/reader/) installed and set as default pdf-viewer.

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/gbv/SignaturenDruck
# Go into the repository
cd SignaturenDruck/signaturenDruck
# Install dependencies
npm install
# Run the app
npm start
```

The app creates the directory `C:\\SignaturenDruck\` and stores the `config.json` in it.

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
- `C:\SignaturenDruck\`
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
![Erfolgreiches laden der Daten](docu/imgs/erfolgreicherStart.PNG?token=Ah-Pd0EhXe4Z_8PPoWR73aePoL9yasF8ks5b7mafwA%3D%3D)  
Sollte dies nicht der Fall sein so wird dies in der Oberfläche angezeigt.
![Keine DefaultDatei vorhanden](docu/imgs/startOhneDefaultDatei.PNG?token=Ah-Pd-fUR3dlUm7_nQwvMt6fs4N3tUliks5b7mblwA%3D%3D)  

### Andere Datei auswählen

Mit einem Klick auf `Dateiauswahl` kann eine andere Datei auswählen aus der dann die Signaturen ausgelesen werden.

### Signaturauswahl

Jede Signatur kann in ihrer Zeile mit einem Klick auf die Checkbox in der Spalte `Drucken` zum Druck ausgewählt werden. Die Auswahl kann einzeln erfolgen oder durch einen Klick auf den Splatenkopf `Drucken`. Dies kehrt die bisher getroffene Auswahl um, sollte also noch keine Signatur zum Druck ausgewählt worden sein, so werden durch einen Klick alle Signaturen der Tabelle zum Druck ausgewählt.  

In der Spalte `Anzahl` kann festegelegt werden wie oft die jeweilige Signatur gedruckt werden soll. Der Standardwert ist `1`.  

In der Spalte `Format` kann, wie der Name schon sagt, das Format ausgewählt werden mit dem die Signatur gedruckt werden soll. Vom gewählten Format ist abhängig nach welchem Schema der Zeilenumbruch erfolgt, wie die Zeilen angeordnet werden und welcher Drucker zum Druck verwendet wird.  

Der Druck der ausgewählten Signaturen erfolgt dann mit einem Klick auf die Schaltfläche `Drucken`. Anschließend wird eine Meldung über den erfolgreichen Druck ausgegeben.  

### Manuelles Anlegen

Der SignaturenDruck ermöglicht nicht nur den Druck von Signaturen aus einer Datei, sondern auch das erstellen von manuellen Signaturen. Mit einem Klick auf die Schaltfläche `Manuelles Anlegen` öffnet sich folgendes Fenster zur Eingabe:  
![Oberfläche manuelles Anlegen](docu/imgs/oberflaecheManuellesAnlegen.PNG?token=Ah-Pd2agTmCO831eG9Wf4YkxX88dS7mFks5b7mYwwA%3D%3D)

Auf der linken Seite befinden sich die Eingabefelder der jeweiligen Zeilen und die Schaltflächen.  
Auf der rechten Seite befinden sich die Übersicht um welche manuelle Signatur es sich handelt, die Vorschau der Signatur, die Auswahl des Formats und die Option den Einzug zu entfernen.  

Nachdem eine Signatur eingetragen wurde, kann mit der Schaltfläche `Nächste` eine weitere Signatur eingetragen werden. Die Schaltfläche `Übernehmen und Beenden` speichert alle eingegebenen Signaturen ab, fügt sie im Hauptfenster der Tabelle hinzu und kehrt zu diesem Fenster zurück.  

Es besteht aber auch die Möglichkeit alle bisher eingetragenen manuellen Signaturen mit der Schaltfläche `Verwerfen und Beenden` gesammelt zu löschen.  

Das löschen einer ein Signatur ist mit der Schaltfläche `löschen` möglich. Diese löscht immer die aktuell angezeigte Signatur.

Mit den Schaltflächen `Vorherige` und `Nächste` kann zwischen den bereits eingetragenen Signaturen navigiert werden. Ist man bei der ersten Signatur angelangt so ist die Schaltfläche `Vorherige` deaktiviert.

### Format erstellen/bearbeiten

Mit der Tastenkombination  
<kbd>strg</kbd> + <kbd>alt</kbd> + <kbd>E</kbd>  
kann das Fenster zum erstellen/bearbeiten von Formaten geöffnet werden.  

![Oberflaeche zum erstellen/bearbeiten von Formaten](docu/imgs/oberflaecheFormatErstellenBearbeiten.PNG?token=Ah-Pd8hfOUr5CkVgwkFtZeTPo35Oahf7ks5b7sV3wA%3D%3D)

#### Format

Mit der Auswahl `Format` ist es möglich die Einstellungen eines bereits erstellen Formats in die Oberfläche zu laden.  

Im Feld `Formatname` kann der Name unter dem das Format abgespeichert werden soll eingetragen werden. Beim speichern des Formates wird geprüft ob bereits ein Format mit dem Namen existiert. Sollte dies der Fall sein so wird ein Dialog angezeigt, der das Überschreiben bzw. ein abbrechen ermöglicht.  

Mit der Auswahl `Druckername` kann der Drucker ausgewählt werden, an dem Signaturen mit dem Format gedruckt werden sollen. Es sind nur Drucker aufgeführt die gerade auf dem jeweiligen Rechner installiert sind bzw. zur Verfügung stehen.  

#### Signatur

Im Feld `Trennzeichen` kann ein Zeichen eingegeben werden welches in der Signatur einen Zeilenumbruch bedeutet.  

Im Feld `Beispiel` ist eine Signatur eingetragen die in der Vorschau zur Veranschaulichung der gewählten Einstellungen dient. Der Feldinhalt kann verändert werden.

*Bei den Formaten __thulb_gross__, __thulb_klein__ und __thulb_klein_1__ erscheint eine Checkbox welche die Möglichkeit bietet den im Format eingetragenen regulären Ausdruck zum festlegen der Zeilen zu übernehmen.*  

#### Papier

Es müssen die Maße des verwendeten Papiers angebeben werden, damit das erstellte PDF passgenau erstellt werden kann. Somit können Unschärfen und ähnliche Effekte die durch Skalierung entstehen verhindert werden.  
*Das Label (Etikett) wird auf dem Papier zentriert*  

| Eigenschaft | Beschreibung |  
| :----------: | ------------ |  
| `Höhe` | die Höhe des Papiers in μm |  
| `Breite` | die Breite des Papiers in μm |  

#### Label (Etikett)

Es werden unterschiedliche Eigenschaften des Label erfasst.

| Eigenschaft | Beschreibung |  
| :----------: | ------------ |  
| `Höhe` | ist die Höhe des Labels in mm |  
| `Breite` | ist die Breite des Labels in mm |  
| `Zeilen` | erfasst die Anzahl der Zeilen des Labels |  
| `Zeilenstand` | erfasst den Abstand zwischen den Zeilen des Labels |  
| `Horizontal zentrieren` | ermöglicht das horizontale zentrieren aller Zeilen |  
| `Vertikal zentrieren` | ermöglicht das vertikale zentrieren aller Zeilen |  
| `Korrekturabstand oben` | ermöglicht eine Veränderung des Abstands beim Drucken von der jeweils ersten Zeile eines Labels zum Rand. Positive Werte vergrößern den Abstand, negative Werte verringern den Abstand. |  


#### Tabelle

In der Tabelle werden für jede Zeile einige Einstellungsmöglichkeiten angezeigt.  

| Spalte | Beschreibung |
| :----: | ------------ |
| `Zeile` | gibt die Nummder der jeweiligen Zeile des Labels an |  
| `Schriftart` | enthält eine Auswahlmöglichkeit der Schrift welche für die betreffende Zeile verwendet werden soll. Es stehen alle auf dem Rechner installierten Schriften zur Verfügung. |  
| `Schriftgröße` | hier kann die Schriftgröße der jeweiligen Zeile eingetragen werden |  
| `Fett` | mit einem Klick auf die jeweilige Checkbox kann die Zeile als **fett** dargestellt werden |  
| `Kursiv` | mit einem Klick auf die jeweilige Checkbox kann die Zeile als _kursiv_ dargestellt werden |  
| `Einzug` | hier kann der Einzug der jeweiligen Zeile in Prozent eingetragen werden |  

  
#### Speichern / Schließen

Mit einem Klick auf `Speichern` kann das Format abgespeichert werden. Zum Abspeichern ist es notwendig das ein `Formatname` vergeben wurde und das ein `Druckername` ausgewählt wurde. Sollte eine der beiden Eingaben fehlen so erscheint ein Hinweis.  
Sollte der Formatname bereits vorhanden sein erscheint ein Dialog, dieser ermöglicht das bereits vorhandene Format mit dem neuen zu überschreiben oder den Vorgang abzubrechen um den Formatnamen zu ändern.  

Mit einem Klick auf `Schließen` wird das Fenster geschlossen. Wurde das Format davor nicht abgespeichert so werden die Veränderungen verworfen.  

## Konfig-Optionen

Die `config.json` unter `C:\SignaturenDruck\` bietet folgende Optionen.  

| key | Beschreibung | Standardwert |
| :---: | --- | ---|
| `defaultPath` | damit kann der Pfad zur Datei verändert werden, welche beim starten des Programms automatisch ausgelesen werden soll. | `"C://Export/download.dnl"` |  
| `defaultFormat` | bietet die Möglichkeit das Standardformat festzulegen. | `"thulb_gross"` |  
| `modalTxt` | bietet die Möglichkeit den Text der Druckerfolgsmeldung anzupassen. | `"Die ausgewählten Signaturen wurden gedruckt."` |  
| `sortByPPN` | ermöglicht die ausgelesenen Daten per PPN sortiert darzustellen. | `false` |  
| `newLineAfter` | dient zur Ermittlung der automatischen Formatauswahl. _spielt nur eine Rolle wenn der thulbMode aktiviert ist_ | `":"` |  
| `useSRU` | ermöglicht die Daten per SRU zu laden | `false` |  
| `SRUaddress` | enthält die URL des SRU-Servers über den die Daten geladen werden, sofern `useSRU: true` | `"http://sru.gbc.de/opac-de-27"` |  
| `thulbMode` | dient zur automatischen Formaterkennung | `true` |  
| `devMode` | dient zur Fehlersuche, zeigt die Fenster der jeweiligen Formate an, die im Formalfall nicht zu sehen sind. Die PDFs werden erstellt aber weder gelöscht noch gedruckt. | `false` |  

### Zeilenfestlegung mit RegEx

Um bei einem Format die Zeilen mittels RegEx festzulegen muss im entsprechenden Format unter `C:\SignaturenDruck\Formate\` ein neuer Schlüssel `splitByRegEx` angelegt werden. Als Beispiele dienen die Einträge von den Formaten `thulb_gross` `thulb_klein`  
___
`thulb_gross`
```json
"splitByRegEx": [
    "^([^:]*) :?",
    "([^:]*) :?",
    "([^:]*) :?",
    "([^:]*) :?",
    "([^:]*) :?",
    "(.*)"
  ]
```
___
`thulb_klein`
```json
"splitByRegEx": [
  "(^.*?\\s[^\\s]+) \\s?",
  "([^(\\s:)]+) \\s?:?",
  "(.*)"
]
```

Die regulären Ausdrücke werden mit der JavaScript Bibliothek [XRegExp](http://xregexp.com/) verarbeitet.

## License

[CC0 1.0 (Public Domain)](LICENSE.md)
