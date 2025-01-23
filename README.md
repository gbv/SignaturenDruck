# SignaturenDruck
![GitHub all releases](https://img.shields.io/github/downloads/gbv/SignaturenDruck/total?label=downloads@overall)  
![GitHub release (latest SemVer including pre-releases)](https://img.shields.io/github/v/release/gbv/SignaturenDruck?label=stable)
![GitHub Release Date](https://img.shields.io/github/release-date/gbv/SignaturenDruck)
![GitHub release (latest by date)](https://img.shields.io/github/downloads/gbv/SignaturenDruck/v1.3.21/total?label=downloads@v1.3.21)  
<!---
![GitHub release (latest SemVer including pre-releases)](https://img.shields.io/github/v/release/gbv/SignaturenDruck?include_prereleases&label=pre-release)
![GitHub (Pre-)Release Date](https://img.shields.io/github/release-date-pre/gbv/SignaturenDruck)
![GitHub release (latest by date)](https://img.shields.io/github/downloads/gbv/SignaturenDruck/v1.3.17/total?label=downloads@v1.3.17)  
-->
![GitHub closed issues](https://img.shields.io/github/issues-closed-raw/gbv/SignaturenDruck)
![GitHub issues](https://img.shields.io/github/issues-raw/gbv/SignaturenDruck)

[Changelog](#changelog)

This is a Electron application to print shelfmarks read from a `.dnl`-file. It displays shelfmarks from the file in a table like structure. You can then select and print the shelfmarks you like.

The printing process creates `.pdf`-files (each per selectet format) and proceeds to print them. 

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)), [python 2.7](https://www.python.org/downloads/release/python-2714/), an c/c++ compiler and the [WiX Toolset v3](https://github.com/wixtoolset/wix3/releases) installed on your computer. From your command line:

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

The app creates either the directory `C:\SignaturenDruck` or `C:\Users\USER\SignaturenDruck` and stores the config files in it.

In the `config.json` you can change the various switches, like `defaultMode` or `defaultDownloadPath`.

The devMode disables the actual printing. It will show the otherwise hidden label-windows. The pdf-files can be found at: `C:\SignaturenDruck`/`C:\Users\USER\SignaturenDruck`.

**Clone and run for a quick way to see Electron in action.**

To build the app for win7/10:

```bash
npm run make
```

This will create an unpacked version, a user installer as well as an msi-installer (machine).
You can find these files in the `out`-directory.
(`out\make\wix` will contain the user-installer, `out\make\squirrel.windows` will contain the msi-installer)

# Dokumentation

## Kurzbeschreibung

Der SignaturenDruck kann Signaturen aus einer Datei auslesen, sie via SRU laden oder auch manuell erstellen.
Das Programm bietet eine Vielzahl an Einstellungsmöglichkeiten. So lassen sich sowohl er Aufbau der Signaturen als auch das Layout der Etiketten aus dem Programm heraus bearbeiten oder neu anlegen.
Zum Druck werden PDF-Dateien erstellt, welche dann an die konfigurierten Drucker gesendet werden.

## Installation

Das Programm kann einfach mit der entsprechenden Installer (`.exe` oder `.msi`) installiert werden.  
Das Programm wird dann unter `C:\Users\USER\AppData\Local\SignaturenDruck` (mittels `.exe`) oder unter `C:\Program Files (x86)\SignaturenDruck` (mittels `.msi`) installiert.  
Auf dem Desktop des Nutzers wird eine Verknüpfung zum starten des SignaturenDrucks erzeugt.

## Arbeiten mit dem Programm

### Start des Programms

Es wird bei jedem Start des Programms geprüft ob die notwendigen Konfigurationsdateien und Ordner vorhanden sind, ist dies nicht der Fall so werden diese neu erstellt.  
Hierbei handelt es sich um:  

- `C:\Export\`
- `C:\Users\USER\SignaturenDruck` oder `C:\SignaturenDruck`
  - `./config.json` - die primäre Konfigurationsdatei (nicht aus der Oberfläche heraus editierbar, nach Veränderungen muss das Programm neugestartet werden).
  - `./Formate\` - enhält die Konfigurationsdateien der eingerichteten Formate.
  - `./FormateCSS\` - enthält die CSS-Dateien der eingerichteten Formate.
  - `./Modi\` - enhält die Konfigurationsdateien der eingerichteten Modi.

Sind diese Ordner/Dateien vorhanden so wird die geprüft ob die Datei die in der `config.json` unter `defaultDownloadPath` angegeben ist existiert.  
Ist dies der Fall dann werden die enthaltenen Signaturen ausgelesen und angezeigt.
![Erfolgreiches laden der Daten](docu/imgs/erfolgreicherStart.PNG?token=Ah-Pd0EhXe4Z_8PPoWR73aePoL9yasF8ks5b7mafwA%3D%3D)  
Sollte die angegebene Datei nicht vorhanden sein, so wird eine entsprechende Meldung in der Oberfläche angezeigt.
![Keine DefaultDatei vorhanden](docu/imgs/startOhneDefaultDatei.PNG?token=Ah-Pd-fUR3dlUm7_nQwvMt6fs4N3tUliks5b7mblwA%3D%3D)  

### Andere Datei auswählen

Mit einem Klick auf `Dateiauswahl` kann man eine andere Datei auswählen, aus der dann die Signaturen ausgelesen werden.

### Signaturauswahl

Jede Signatur kann in ihrer Zeile mit einem Klick auf die Checkbox in der Spalte `Drucken` zum Druck ausgewählt werden. Die Auswahl kann einzeln erfolgen oder durch einen Klick auf den Splatenkopf `Drucken`. Dies kehrt die bisher getroffene Auswahl um, sollte also noch keine Signatur zum Druck ausgewählt worden sein, so werden durch alle Signaturen der Tabelle zum Druck ausgewählt.  

In der Spalte `Anzahl` kann festegelegt werden wie oft die jeweilige Signatur gedruckt werden soll. Der Standardwert ist `1`.  

In der Spalte `Format` kann, wie der Name schon sagt, das Format ausgewählt werden mit dem die Signatur gedruckt werden soll. Vom gewählten Format ist abhängig wie die Signatur dargestellt wird, wie groß das Etikett ist und an welchem Drucker gedruckt werden soll.  

Der Druck der ausgewählten Signaturen erfolgt dann mit einem Klick auf die Schaltfläche `Drucken`. Anschließend wird eine Meldung über den erfolgreichen Druck ausgegeben.

### Manuelles Anlegen

Der SignaturenDruck ermöglicht nicht nur den Druck von Signaturen aus einer Datei oder via SRU, sondern auch das erstellen von manuellen Signaturen. Mit einem Klick auf die Schaltfläche `Manuelles Anlegen` öffnet sich folgendes Fenster zur Eingabe:  
![Oberfläche manuelles Anlegen](docu/imgs/oberflaecheManuellesAnlegen.PNG)

Auf der linken Seite befinden sich die Eingabefelder der jeweiligen Zeilen und die Schaltflächen.  
Rechts befinden sich die Übersicht um welche manuelle Signatur es sich handelt, die Vorschau der Signatur, die Auswahl des Formats und die Option den Einzug zu entfernen.  

Nachdem eine Signatur eingetragen wurde, kann mit der Schaltfläche `Nächste` eine weitere Signatur eingetragen werden. Die Schaltfläche `Übernehmen und Beenden` speichert alle eingegebenen Signaturen ab, fügt sie im Hauptfenster der Tabelle hinzu und kehrt zu diesem Fenster zurück.  

Es besteht aber auch die Möglichkeit alle bisher eingetragenen manuellen Signaturen mit der Schaltfläche `Verwerfen und Beenden` gesammelt zu löschen.  

Das löschen einer einzelnen Signatur ist mit der Schaltfläche `löschen` möglich. Diese löscht immer die aktuell angezeigte Signatur.  

Mit den Schaltflächen `Vorherige` und `Nächste` kann zwischen den bereits eingetragenen Signaturen navigiert werden. Ist man bei der ersten Signatur angelangt so ist die Schaltfläche `Vorherige` deaktiviert.

## Modus erstellen / anpassen

Seit Version v1.1.0-a wird mit Modi/Untermodi der Aufbau der Signaturen festgelegt, wobei jedem Untermodus ein eigenes Format zugeordnet ist, welches den Aufbau des Etiketts festlegt.

Mit der Tastenkombination  
<kbd>strg</kbd> + <kbd>alt</kbd> + <kbd>C</kbd>  
kann das Fenster zum erstellen / bearbeiten eines Modus geöffnet werden.  

![Oberflaeche zum erstellen / bearbeiten eines Modus](docu/imgs/oberflaecheModusErstellenBearbeiten.PNG)

### Modus

#### Modus

Im Dropdown kann entweder ein bereits bestehender Modus oder ein "--neuer Modus--" ausgewählt werden.  
Der Name des Modus kann dann Namensfeld eingetragen werden. Wurde ein bereits bestehender Modus gewählt so wird dessen Name in das Feld geladen

#### Untermodus

Im Dropdown werden alle Untermodi des bereits gewählten Modus angezeigt. Analog zum Modus kann ein neuer Untermodus angelegt werden oder der ausgewählte Untermodus bearbeitet werden.
Der Name des Untermodus legt auch den Namen des zugehörigen Formats fest.  

### Signaturenaufbau

#### Beispiel

In diesem Feld wird die Beispielsignatur aus der `config.json` geladen. Die Signatur kann verändert werden.  

#### RegEx

In diesem Feld wird der BeispielregEx aus der `config.json` geladen. Der RegEx dient zum zerlegen der Signatur.  

#### Delimiter

Der Delimiter wird ebenfalls aus der `config.json` geladen. Er dient dazu die Signatur zu zerlegen.  

#### Funktion

Die eingetragene Signatur kann entweder mit dem `RegEx` oder mit dem `Delimiter` zerlegt werden. Dies geschieht nach einem Klick auf `Testen`. Das Resultat wird in der `Vorschau` ersichtlich. Die einzelnen Gruppen werden oben rechts unter `Hinweise` aufgeschlüsselt.  

### Ergebnis

Hier kann die Anzahl der Zeilen und die Anordnung der Signaturenteile angepasst werden. Wurden Anpassungen vorgenommen, so werden diese nach einem Klick auf `Aktualisieren` in der `Vorschau` sichtbar.  
Die Signaturenteile werden mit Platzhaltern dargestellt. So entspricht der Signaturenteil 5 dem Platzhalter `$5`. Alle Platzhalter und ihr aktueller Inhalt sind unter `Hinweise` aufgeschlüsselt.  
Es ist auch möglich, einen festen Text einzutragen der dann immer mit diesem Format, in der entsprechenden Zeile, Anwendung findet.  

Sobald Sie mit der Anordnung der Signaturenteile zufrieden sind und auf `Weiter` geklickt haben, öffnet sich das Formatfenster. Dort können Sie die Gestaltung des Etiketts vornehmen.

Nach dem erfolgreichen Anlegen muss das Programm neu gestartet werden. Soll ein anderer Modus verwendet werden, so muss in der `config.json` der `defaultMode` geändert werden.

## Format anpassen

Mit der Tastenkombination  
<kbd>strg</kbd> + <kbd>alt</kbd> + <kbd>E</kbd>  
kann das Fenster zum anpassen von Formaten geöffnet werden.  

![Oberflaeche zum anpassen von Formaten](docu/imgs/oberflaecheFormatErstellenBearbeiten.PNG)

### Format

Mit der Auswahl `Format` ist es möglich die Einstellungen eines bereits erstellen Formats in die Oberfläche zu laden.  

Im Feld `Formatname` wird der Formatname angezeigt, dieser ist nicht editierbar. Beim speichern wird ein Dialog angezeigt, der das anpassen bzw. ein abbrechen ermöglicht.  

Mit der Auswahl `Druckername` kann der Drucker ausgewählt werden, an dem Signaturen mit dem Format gedruckt werden sollen. Es sind nur Drucker aufgeführt die gerade auf dem jeweiligen Rechner installiert sind bzw. zur Verfügung stehen.  

### Signatur

Im Feld `Beispiel` wird die Signatur angezeigt die beim anlegen dieses Formates bzw. beim anlegen des Untermodus festgelegt wurde. Der Feldinhalt kann nicht verändert werden.

### Papier

Es müssen die Maße des verwendeten Papiers angegeben werden, damit das erstellte PDF passgenau erstellt werden kann. Somit können Unschärfen und ähnliche Effekte die durch Skalierung entstehen verhindert werden.  
*Das Label (Etikett) wird auf dem Papier zentriert*  

| Eigenschaft | Beschreibung |  
| :----------: | ------------ |  
| `Höhe` | die Höhe des Papiers in μm |  
| `Breite` | die Breite des Papiers in μm |  

### Label (Etikett)

Es werden unterschiedliche Eigenschaften des Labels erfasst.  
***HINWEIS - die Höhe sowie Breite des Labels sollte um mindestens 1mm kleiner sein als die entsprechenden Papierwerte***

| Eigenschaft | Beschreibung |  
| :----------: | ------------ |  
| `Höhe` | ist die Höhe des Labels in mm |  
| `Breite` | ist die Breite des Labels in mm |  
| `Zeilen` | erfasst die Anzahl der Zeilen des Labels |  
| `Zeilenstand` | erfasst den Abstand zwischen den Zeilen des Labels |  
| `Horizontal zentrieren` | ermöglicht das horizontale zentrieren aller Zeilen |  
| `Vertikal zentrieren` | ermöglicht das vertikale zentrieren aller Zeilen |  
| `Korrekturabstand oben` | ermöglicht eine Veränderung des Abstands beim Drucken von der jeweils ersten Zeile eines Labels zum Rand. Positive Werte vergrößern den Abstand, negative Werte verringern den Abstand. |  

### Tabelle

In der Tabelle werden für jede Zeile einige Einstellungsmöglichkeiten angezeigt.  

| Spalte | Beschreibung |
| :----: | ------------ |
| `Zeile` | gibt die Nummder der jeweiligen Zeile des Labels an |  
| `Schriftart` | enthält eine Auswahlmöglichkeit der Schrift welche für die betreffende Zeile verwendet werden soll. Es stehen alle auf dem Rechner installierten Schriften zur Verfügung. |  
| `Schriftgröße` | hier kann die Schriftgröße der jeweiligen Zeile eingetragen werden |  
| `Fett` | mit einem Klick auf die jeweilige Checkbox kann die Zeile als **fett** dargestellt werden |  
| `Kursiv` | mit einem Klick auf die jeweilige Checkbox kann die Zeile als _kursiv_ dargestellt werden |  
| `Einzug` | hier kann der Einzug der jeweiligen Zeile in Prozent eingetragen werden |  

### Speichern / Schließen

Mit einem Klick auf `Speichern` kann das Format abgespeichert bzw. können die Änderungen übernommen werden.  

Mit einem Klick auf `Schließen` wird das Fenster geschlossen. Wurde das Format davor nicht abgespeichert so werden die Veränderungen verworfen.  

## Konfig-Optionen

Die `config.json` unter `C:\Users\USER\SignaturenDruck` oder `C:\SignaturenDruck\` bietet folgende Optionen.  

| key | Beschreibung | Standardwert |
| :---: | --- | ---|
| `defaultDownloadPath` | damit kann der Pfad zur Datei verändert werden, welche beim starten des Programms automatisch ausgelesen werden soll. | `"C:/Export/download.dnl"` |  
| `sortByPPN` | ermöglicht die ausgelesenen Daten per PPN sortiert darzustellen. | `false` |  
| `useK10plus` | ermöglicht die Verwendung des Datenformates der WinIBW mit K10plus | `true` |  
| `hideDeleteBtn` | ermöglicht das ausblenden des 'Lösche Download Datei'-Buttons | `false` |  
| `showMenu` | ermöglicht das einblenden einer Menüleiste | `false` |  
| `filterByLoc` | ermöglicht eine Unterscheidung der Formate mittels Standort | `false` |
| `example.shelfmark` | legt eine Signatur fest, die beim anlegen eines neuen Modus/Untermodus angezeigt wird | `"PÄD:TG:1420:Dan::2017"` |  
| `example.location` | legt einen Standort fest, der als Beispielstandort beim anlegen eines neuen Modus/Untermodus angezeigt wird | `"MAG"` |  
| `example.regex` | legt einen regulären Ausdruck fest, der beim anlegen eines neuen Modus/Untermodus angezeigt wird | `"^(.*):(.*):(.*):(.*):(.*):(.*)$"` |  
| `example.delimiter` | legt einen Delimiter fest, der beim anlegen eines neuen Modus/Untermodus angezeigt wird |  
| `modal.showModal` | legt fest ob die Nachricht der erfolgreichen Drucks angezeigt werden soll | `true` |  
| `modal.modalTxt` | bietet die Möglichkeit den Text der Druckerfolgsmeldung anzupassen. | `"Die ausgewählten Signaturen wurden gedruckt."` |  
| `SRU.useSRU` | ermöglicht die Daten per SRU zu laden | `false` |  
| `SRU.printImmediately` | ermöglicht den Sofortdruck | `false` |  
| `SRU.SRUAddress` | enthält die URL des SRU-Servers über den die Daten geladen werden, sofern `useSRU: true` | `"http://sru.k10plus.de/opac-de-27"` |  
| `SRU.QueryPart1` | der erste Teil des SRU-Query | `"?version=1.1&operation=searchRetrieve&query=pica.bar="` |  
| `SRU.QueryPart1EPN` | der erste Teil des SRU-EPN-Query | `"?version=1.1&operation=searchRetrieve&query=pica.bar="` |  
| `SRU.QueryPart2` | der zweite Teil des SRU-Query | `"&maximumRecords=1&recordSchema=picaxml"` |  
| `print.printCoverLabel` | ermöglicht den Druck des CoverLabels (Username + Datum) | `true` |  
| `print.reverseOrder` | ermöglicht die Signaturen in umgedrehter Reihenfolge zu drucken | `false` |  
| `print.printerList` | wird beim ersten Start automatisch erzeugt, enthält alle verfügbaren Druckernamen, kann nicht verändert werden | - |  
| `print.showPrintDialog` | ermöglicht ein ausblenden der Druckbestätigung | `true` |  
| `print.orientation` | legt die Ausrichtung des Drucks fest, Optionen: `landscape`,`portrait` | `landscape` |  
| `print.scale` | legt die Skalierung des Drucks fest, Optionen: `noscale`, `shrink`, `fit` | `noscale` |  
| `print.margin` (`.top`; `.bottom`; `.left`; `.right`;) | legen eine entsprechende Margin beim Druck fest | `0` |  
| `mode.defaultMode` | legt den zu verwendenden Modus fest | `"thulbMode"` |  
| `devMode` | dient zur Fehlersuche, zeigt die Fenster der jeweiligen Formate an, die im Formalfall nicht zu sehen sind. Die PDFs werden erstellt aber weder gelöscht noch gedruckt. | `false` |  
| `username` | der Nutzername des letzten Benutzers, wird automatisch geschrieben, kann nicht verändert werden | - |  
| `defaultProgrammPath` | enthält den Pfad des SignaturenDrucks, wird automatisch geschrieben, kann nicht verändert werden | - |  
| `sigJSONFile` | enthält den Namen der temporären Signaturendatei, wird automatisch geschrieben | - |  
| `configVersion` | enthält die Versionsnummer der Konfigurationsdatei, sollte nicht manuell verändert werden | - |

## FAQ

### Modus / Untermodus

#### Ich sehe das Format, kann es aber nie auswählen

Dies kann zwei Ursachen haben.  
1. Ursache: Das Format gehört zu einem Untermodus der nicht dem derzeitigen Modus zugeordnet ist.
Lösung: Tragen Sie in der `config.json` den Modus zu dem der Untermodus gehört als `defaultMode` ein und starten das Programm neu.  

2. Ursache: Die Signaturen entsprechen nicht der im Untermodus festgelegten Aufteilung.  
Erklärung: Beim auslesen der Signaturen aus einer Datei oder via SRU wird geprüft welche Untermodi/Formate diese Signatur entsprechend Festlegung darstellen können.  
Lösung: Wenn eine Signatur eigentlich einem Format entsprechen sollte, aber dieses nicht auswählbar ist, so sollten Sie den Untermodus kontrollieren.  
Mit <kbd>strg</kbd> + <kbd>alt</kbd> + <kbd>C</kbd> öffen Sie die "Modus erstellen / anpassen"-Oberfläche. Nun wählen Sie den Modus und endsprechenden Untermodus aus und können die Konfiguration prüfen.

### Sonstige

#### Wird der Adobe Acrobat Reader DC weiterhin als Standard PDF-Programm benötigt?

Nein, der SignaturenDruck ist seit version `v1.3.12` nichtmehr vom Adobe Acrobat Reader DC abhängig.

# Changelog

## v1.3.21

- FOLIO-SRU wird unterstützt **Vielen Dank an @knepper & UB Mainz!**

## v1.3.20

- führende Nullen werden im Barcode beachtet (Issue [#111](https://github.com/gbv/SignaturenDruck/issues/111))

## v1.3.18

- Electron aktualisiert auf `v26`

## v1.3.17

- Dokumentation angepasst
- Adobe Acrobat Reader DC wird nicht mehr benötigt (intern wird SumatraPDF verwendet)
- Aktualisierung auf electron `v22.3.2`
- Portable Version entfällt (der Performance geschuldet)
- 4-Installer
  - `...user-conf_system-install` ->systemweite Installation mit Konfigurationsdateien im Nutzerverzeichnis `C:\Users\USER\SignaturenDruck`
  - `...user-conf_user-install`-> Nutzerinstallation mit Konfigurationsdateien im Nutzerverzeichnis `C:\Users\USER\SignaturenDruck`
  - `...system-conf_system-install`-> systemweite Installation mit Konfigurationsdateien unter `C:\SignaturenDruck`
  - `...system-conf_user-install`-> Nutzerinstallation mit Konfigurationdateien unter `C:\SignaturenDruck`
- optimierung des Manuellen Erstellens
- Manuelle Signaturen können via Doppelklick auf die Signatur editiert werden
- Installer werden nun mit electron-forge erzeugt
- Interne Optimierungen
- die `configVersion` in `config.js` wird geprüft, ggfs. wird die `config.js` automatisch aktualisiert
- in config.js
  - `defaultPath` wurde in `defaultDownloadPath` umbenannt
  - `print.reverseOrder` hinzugefügt, ermöglicht die Signaturen in umgedrehter Reihenfolge zu drucken
  - `print.printerList` hinzugefügt, wird vom Programm erzeugt und kann nicht verändert werden
  - `print.showPrintDialog` hinzugefügt, ermöglicht ein ausblenden der Druckbestätigung
  - `print.orientation` hinzugefügt, legt die Ausrichtung des Drucks fest
  - `print.scale` hinzugefügt, legt die Skalierung des Drucks fest
  - `print.margin`(`.top`; `.bottom`; `.left`; `.right`;) hinzugefüt, ermöglicht das festlegen einer Margin beim Druck
  - `username` hinzugefügt, enthält den Nutzernamen des letzten Benutzers
  - `defaultProgrammPath` hinzugefügt, enthält den Pfad des SignaturenDrucks, wird automatisch geschrieben und kann nicht verändert werden
  - `sigJSONFile` hinzugefügt, enthält den Namen der temporären Signaturendatei, wird automatisch geschrieben, kann nicht verändert werden
  - `configVersion` hinzugefügt, enthält die Versionsnummer der Konfigurationsdatei, sollte nicht manuell verändert werden
- `configVersion` in `config.js` auf den Wert `1.1` gesetzt


## v1.2.0

- alle Änderungen aus den Versionen [v1.1.1-g](##v1.1.1-g-dev), [v1.1.1-f](##v1.1.1-f-dev) und [v1.1.1-e-dev](##v1.1.1-e-dev) übernommen.
- Dokumentation angepasst

## v1.1.1-g-dev

- Die Standortwerte aus 'config.json' werden beim editieren von Untermodi nurnoch als Platzhalter eingetragen, wenn die Werte nicht direkt gesetzt wurden (issue [#67](https://github.com/gbv/SignaturenDruck/issues/67))

## v1.1.1-f-dev

- Verbesserte Fehlerbehandlung von Konfigurationsdateien (issue [#17](https://github.com/gbv/SignaturenDruck/issues/17), [#36](https://github.com/gbv/SignaturenDruck/issues/36))
- Menü Label korrigiert (issue [#32](https://github.com/gbv/SignaturenDruck/issues/32))
- SRU-Dropdown 'PPN' durch 'Barcode' ersetzt (issue [#41](https://github.com/gbv/SignaturenDruck/issues/41))
- Fehlerhafte Datumsanzeige bei mehreren Exemplaren behoben (issue [#65](https://github.com/gbv/SignaturenDruck/issues/65))
- Konfigeintrag 'hideDeleteBtn' eingeführt, ermöglicht das ausblenden der 'Lösche Download Datei' Option. Standadwert ist 'false' (issue [#66](https://github.com/gbv/SignaturenDruck/issues/66))

## v1.1.1-e-dev

- Version wird nun im Titel des Hauptfensters mit angezeigt (issue [#59](https://github.com/gbv/SignaturenDruck/issues/59))
- Im Ordner Formate & FormateCSS werden Dateien mit falschem Dateiformat ignoriert (issue [#17](https://github.com/gbv/SignaturenDruck/issues/17))
- Eine fehlerhafte Konfigurationsdatei wird nun nichtmehr kommentarlos ersetzt. (issue [#36](https://github.com/gbv/SignaturenDruck/issues/36))  
    Sie wird als 'config_invalid.json' abgespeichert und es wird eine valide Standardkonfig angelegt.
- Es wurden einige Verbesserungen beim erstellen/bearbeiten von Modi/Untermodi umgesetzt (issue [#56](https://github.com/gbv/SignaturenDruck/issues/56), [#50](https://github.com/gbv/SignaturenDruck/issues/50))
- Es ist nun möglich den Sofortdruck via Konfigeintrag automatisch auszuwählen (issue [#58](https://github.com/gbv/SignaturenDruck/issues/58))
- .json Konfigurationsdateien werden nun formatiert angelegt (issue [#37](https://github.com/gbv/SignaturenDruck/issues/37))
- Ein Menü mit den Optionen 'Schließen', 'Format', 'Modus wurde hinzugefügt. Der entsprechende Konfigeintrag ist 'showMenu', Standardwert ist 'false' (issue [#32](https://github.com/gbv/SignaturenDruck/issues/32))
- Der Konfigeintrag 'filterByLoc' ermöglicht das festlegen von Formaten für gewisse Standorte. Standardwert ist 'false' (issue [#60](https://github.com/gbv/SignaturenDruck/issues/60))
- Das SRU-Fenster wurde die Auswahl zwischen PPN/EPN ergänzt. Dafür ist der Konfigeintrag 'SRU.QueryPart1EPN' nötig, der Standardwert ist '?version=1.1&operation=searchRetrieve&query=pica.epn=' (issue [#41](https://github.com/gbv/SignaturenDruck/issues/41))
- Optimierungen:
  - main.js: Funktion 'checkConfig' überarbeitet
  - npm update ausgeführt

## v1.1.1-d

- Horizontale Zentrierung der Label auf dem Papier korrigiert
- Option für Sofortdruck umgesetzt (issue [#15](https://github.com/gbv/SignaturenDruck/issues/15), nur wenn Daten via SRU geladen werden)
- Hinweis für den Fall hinzugefügt, dass die erzeugten PDFs nicht automatisch gelöscht werden konnten (Reader war bereits geöffnet)
- Ausgelesene Signaturen (SRU/Datei) sind nun mittels Doppelklick auf den Signaturentext editierbar
- weitere interne Optimierungen

### Hinweis

 Die Problematik mit Feld 209A/7100 $B hat keinerlei Auswirkung auf die Funktionsweise des Programms

## v1.1.1-c

- Bei der Eingabe von manuellen Signaturen bleibt die Eingabe der vorherigen Signatur erhalten
- Problem mit SRU-Abfragen gelöst (issue [#51](https://github.com/gbv/SignaturenDruck/issues/51))

## v1.1.1-b

- SRU liefert jetzt die Daten des eingegebenen Barcodes (nicht des ersten Exemplars)
- Manuelle Signaturen werden nun bei einem Klick auf 'Liste löschen' ebenfalls gelöscht
- Manuelle Signaturen bleiben sichtbar nach dem hinzufügen einer Signatur via SRU
- Pdf-erzeugung optimiert
- Problem mit einzeiligen Signaturen behoben

## v1.1.1-a

- fehler beim erzeugen eines neuen Modus/Untermodus behoben

## v1.1.0-d

- Platzhalter für das aktuelle Datum hinzugefügt ($DATE)
- Warnung für fehlende Drucker angepasst
- einige Meldungstexte angepasst
- PDFs werden erst nach 10 Sekunden gelöscht
- es kann nun eine portable exe erstellt werden (npm run build:portable)
- Dokumentation angepasst
- die ausgelesene Datei kann nun wieder gelöscht werden

# License

[CC0 1.0 (Public Domain)](LICENSE.md)
