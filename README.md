CSV.js
======

Fully [RFC 4180](http://www.ietf.org/rfc/rfc4180.txt) compliant CSV file format importer, exporter and handler.
CSV.js is written in pure JavaScript and it does not have any dependencies on other libraries (and it never will).

Disclaimer
----------

I am not responsible of your use of this piece of code. That said, it has been tested and it has worked for me well.

Licence
-------

MIT licence, although I'd appreciate if you sent me your modifications if they improve on CSV file
handling.

Examples and usage
------------------
Create a CSV file with two cells, 'Hello' and 'world!' on a single row:

	var csv = new CSVFile('Hello,world!');

Fetch the previously created row from the object:

	var row = csv.getRow(0).data; // ['Hello', 'world!']

Columns can be fetched in the same way:

	var column = csv.getColumn(0).data; // ['Hello']
	
And so can individual cells:

	var cell = csv.getCell(0, 0).data; // ['Hello']

Rows, columns and individual cells can also be set, using ```setRow(index, arr)```, ```setColumn(index, arr)``` and ```setCell(row, column, value)```, respectively:

	var grid = new CSVFile(',,,,,,\n,,,,,,\n,,,,,,\n,,,,,,\n,,,,,,'); // empty 5-by-6 grid.
	
	grid.setRow(0, ["first row"]); // Fill the first row with "first row".
	grid.setColumn(0, ["first column"]); // Fill the first column in the same way.
	grid.setCell(3, 3, ["individual cell"]); // Set individual cell content.

CSVFile constructor has a second (optional) parameter, config. Config allows to overwrite, change or add _any_ portion
of the CSVFile object and it is explicitly meant to do so. The currently supported parameters are listed in the table
below:

| Parameter      | Default value | Description                                                                                        |
|----------------|---------------|----------------------------------------------------------------------------------------------------|
| charset        | utf-8         | Defines the character set of  the CSV file. Stores it to be passed as metadata in HTTP header.     |
| hasRowNames    | false         | Defines if the imported file has row names. Row names are always fetched from the leftmost column. |
| hasColumnNames | false         | Same as hasRowNames, but for columns. If true, first row is selected as column labels.             |

Using these options one can handle the cases where the CSV file has row and column labels:

	var csv2 = new CSVFile(',Column 1,Column 2\nRow 1,Hello,world!', {hasRowNames: true, hasColumnNames: true});
	var rowWithNames = csv.getRow(0); // An object with proper row and column names.

The file content can be imported separately from the constructor by calling ```CSVFile.import(content)```. Assuming you
already created ´´´csv´´´ in the first example, you can import new content over it:

	var newContent = 'I think, therefore, I am.';
	csv.import(newContent);
	var newRow = csv.getRow(0).data; // ['I think', 'therefore', 'I am.']

Similarly, there exists an export function, ```CSVFile.export()```, which creates a saveable string in the same
format in which the file was imported.

CSV file format predates RFC 4180 by decades, and there exists a vast number of nearly compatible subformats that
differ mainly in their separators. CSVFile is able to load such files by altering the different separators. Separators
are not set through config, but by calling the function ```CSVFile.setSeparators()```. Here is an example on how to
load tab-delimited content:

	csv3 = new CSVFile(null, {hasRowNames: true, hasColumnNames: true});
	csv3.setSeparators('\n', '\t', '.', '"'); // Row, column, decimal and quote separators.
	csv3.import('\tColumn 1\t\Column 2\nRow 1\tHello\tworld!');

If these separator rule sets are not enough, one can modify the regular expressions directly via config (see the top
of file ```CSV.js``` for variable names), yet this is highly unrecommended, as this will very likely break some of
the internal processes.

To see how local files can be loaded from client's hard drives using HTML5's File API, read accompanied file
```index.html``` that does so.