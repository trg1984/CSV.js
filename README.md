CSV.js
======

Adds CSV file format import and export support to JavaScript. JQuery is not (and never will be)
a dependency for using CSV.js. It is included here to ease the demonstration of the library.

Licence
-------

MIT licence, although I'd appreciate if you sent me your modifications if they improve on CSV file
handling.

Current goal and TODOs
----------------------

TODO
----
* Compliance with CSV spec: http://tools.ietf.org/html/rfc4180  (RFC 4180 - Common Format and MIME Type for CSV Files )
	* case with no CRLF nor cell change at the end of the record and file.
	* enforce "each record (line) should contain same amount of elements"
	* Double quote escapes using just double quotes. If double-quotes are used to enclose fields, then a double-quote appearing inside a field must be escaped by preceding it with another double quote.
	* Symbols have specific ranges and definitions.
	* 
		COMMA = %x2C
		CR = %x0D ;as per section 6.1 of RFC 2234 [2]
		DQUOTE =  %x22 ;as per section 6.1 of RFC 2234 [2]
		LF = %x0A ;as per section 6.1 of RFC 2234 [2]
		CRLF = CR LF ;as per section 6.1 of RFC 2234 [2]
		TEXTDATA =  %x20-21 / %x23-2B / %x2D-7E
		
	* Optional mime header parameters: charset, header.
		Common usage of CSV is US-ASCII, but other character sets defined
		by IANA for the "text" tree may be used in conjunction with the
		charset" parameter.
* Setters for rows and columns with support for multiples of the original length.



