import csv
import json

csvfile = open('bihar.csv', 'r')
jsonfile = open('Biharcsv.json', 'w')

reader1 = csv.reader(csvfile)
header = tuple(next(reader1))  # gets the first line
print header
fieldnames = header
reader = csv.DictReader( csvfile, fieldnames)
jsonfile.write('[')
row1 = next(reader)
json.dump(row1, jsonfile, indent=4, sort_keys=False)

for row in reader:
	jsonfile.write(',')
	json.dump(row, jsonfile, indent=4, sort_keys=False)
	
	jsonfile.write('\n')
	

jsonfile.write(']')