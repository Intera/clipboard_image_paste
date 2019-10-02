# Redmine clipboard\_image\_paste plugin

## Changes in this fork
the branch "add-annotation-features" is work in progress and re-implements the crop functionality with fabricjs and adds a free-drawing marker tool to make annotations.
internally it uses an image editor object that creates a toolbar and calls activation methods for tools in a configuration object.
text annotations and arrows are on the roadmap.

## General

Paste (cropped) image from clipboard as an
attachment.

![](https://raw.github.com/peclik/clipboard_image_paste/master/suppl/cbp_logo.png)

  - uses **pure client side JavaScript**
  - attachment **works for issues, wiki, news, files, documents,
    forums**
  - image can be interactively **cropped**
  - works **only in Google Chrome, Mozilla Firefox and the last versions
    of Internet Explorer (\>=11)**
  - translations: Bulgarian, Czech, English, French, German, Italian,
    Japanese, Korean, Polish, Portuguese (+ Brazil), Russian, Simplified
    Chinese, Spanish, Taiwanese Mandarin, Turkish

<!-- end list -->

  - homepage: https://github.com/peclik/clipboard\_image\_paste
  - Redmine page: http://www.redmine.org/plugins/clipboard\_image\_paste

-----

## Installation:

  - download one of:
      - latest release zip:
        https://github.com/peclik/clipboard\_image\_paste/archive/v1.12.zip
      - development zip:
        https://github.com/peclik/clipboard\_image\_paste/archive/master.zip
      - git: `git clone
        https://github.com/peclik/clipboard_image_paste.git
                plugins/clipboard_image_paste`
  - place plugin files into `plugins/clipboard_image_paste` folder
    (strip possible `-master` or `-version` suffix)
  - restart Redmine instance
  - Redmine 2.5 and older: it's recommended to install RMagick gem,
    otherwise attached images will not show in exported PDF files

-----

## Compatibility:

  - Redmine up to 3.4.x, 2.x, 1.4.x
  - **works only in Google Chrome, Mozilla Firefox and the last versions
    of Internet Explorer (\>=11)**
  - plug-ins taking advantage of clipboard\_image\_paste:
      - KbArticle \[https://github.com/alexbevi/redmine\_knowledgebase\]

-----

## Authors:

  - Richard Pecl \[https://github.com/peclik\]
  - used clipboard handler snippet by Joel Besada
  - used uploaded image data to file object conversion
    code snippet by Alexandr Ivanov
  - used jQuery, jQuery UI and Jcrop javascript libraries
  - Ivan Cenov (Bulgarian translation) \[https://github.com/jwalkerbg\]
  - AlexStein (Russian translation) \[https://github.com/AlexStein\]
  - octane100 (French translation) \[https://github.com/octane100\]
  - Karsten Hoffrath (German translation)
    \[https://github.com/khoffrath\]
  - ks780 (Turkish translation) \[https://github.com/ks780\]
  - Daigo Uchiyama (Japanese translation) \[https://github.com/ucho\]
  - jaelys (Taiwanese Mandarin translation)
    \[https://github.com/jaelys\]
  - beandj (Brazilian Portuguese translation)
    \[https://github.com/beandj\]
  - Yuri Tkachenko (2.3 compatibility fix)
    \[https://github.com/tamtamchik\]
  - Mo Di (Simplified Chinese translation) \[https://github.com/modi\]
  - Ezequiel Gonzalez Rial (Spanish translation)
    \[https://github.com/ezequielgonzalez\]
  - Patricia Sz. (Polish translation) \[https://github.com/papisz\]
  - R-i-c-k-y (Italian translation) \[https://github.com/R-i-c-k-y\]
  - battlej (Korean translation) \[https://github.com/battlej\]
  - Miguel Borges (Portuguese translation)
    \[https://github.com/mapb1990\]
  - ilya-tcykunov (IE 11 compatibility)
    \[https://github.com/ilya-tcykunov\]
  - Ben305 (JCrop patch for Redmine 3.0) \[https://github.com/Ben305\]
  - mouson (Taiwanese Mandarin translation update)
    \[https://github.com/mouson\]
  - AThomsen (Danish translation) \[https://github.com/AThomsen\]

-----

## Known issues:

  - thumbnails using `{{thumbnail}}` macro will not be shown in exported
    PDFs
    (another Redmine's PDF export limit - see
    http://www.redmine.org/issues/13051)
  - maximum attachment size is checked against BASE64 encoded image data
    (even
    smaller images than the maximum allowed attachment size can be
    rejected)
  - clipboard\_image\_paste's 'Add picture from clipboard' command
    combines number
    of both regular files and pasted images for maximum number of
    attachment check,
    while Redmine's original 'Add another file' counts only regular
    files
  - ability to copy\&paste images from clipboard depends on browsers
    capabilities
    \- some browsers don't support all image formats in the clipboard
  - Redmine 2.5 and older: attached image will be visibile in exported
    PDFs only
    if RMagick is installed (this is a limit of PDF export in Redmine -
    alpha channel
    must be removed from png image)
  - see Compatibility section for incompatible plug-ins

-----

## Changelog:

    28.06.2017 RELEASED 1.12
    [!] Redmine 3.4 compatible
    [-] Corrected improper use of the tag <p>

    28.06.2017 RELEASED 1.11
    [+] Don't remove alpha channel from PNG image for Redmine >=2.6
    [+] Added Danish translation

    07.03.2015 RELEASED 1.10
    [!] Redmine 3.0 compatible
    [-] JCrop patch for compatibility with jQuery used in Redmine 3.0
    [*] Taiwanese Mandarin translation updated

    24.10.2014 RELEASED 1.9
    [!] Redmine 2.6 compatible
    [!] Internet Explorer 11 compatible
    [!] Jcrop upgraded to 0.9.12
    [+] Added Portuguese translation

    22.10.2013 RELEASED 1.8
    [-] Attached images are visible in exported PDF files (requires RMagick gem)
    [+] Added support for KbArticle plug-in

    27.06.2013 RELEASED 1.7
    [-] JavaScript fix for Firefox 22 compatibility
    [+] Added Korean translation

    09.05.2013 RELEASED 1.6
    [+] Added Italian, Polish, Simplified Chinese, Spanish translations

    22.03.2013 RELEASED 1.5
    [!] Redmine 2.3 compatible
    [*] JavaScript/JQuery fix for Redmine 2.3 compatibility
    [+] Added Brazilian Portuguese translation

    06.03.2013 RELEASED 1.4
    [+] Added German, Japanese, Taiwanese Mandarin, Turkish translations

    25.01.2013 RELEASED 1.3
    [+] Added French translation

    22.01.2013 RELEASED 1.2
    [+] Added dialog to copy image link for wiki

    21.01.2013 RELEASED 1.1
    [!] Supports Redmine version 1.4.0 to 2.2.x
    [+] Added Russian translation

    18.01.2013 RELEASED 1.0
    --------------------------------------------------------------------------------
    Legend:
    [+] Added feature
    [*] Improved/changed feature
    [-] Bug fixed (we hope)
    [!] Important info
