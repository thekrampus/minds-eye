#!/usr/bin/python2.6

import csv, cgi, cgitb


def recordGuess(item, guess):
    rows = []
    offset = {
        'horse': 1,
        'weed': 2,
        'mind': 3
    }[guess]

    with open('database.csv', 'r') as file:
        read = csv.reader(file, delimiter=',', quoting=csv.QUOTE_NONE)

        for row in read:
            rows.append(row)

        stat = 0
        index = 0
        if item in rows[0]:
            stat = 0
            index = rows[0].index(item)
        elif item in rows[4]:
            stat = 4
            index = rows[4].index(item)
        elif item in rows[8]:
            stat = 8
            index = rows[8].index(item)
        else:
            return #critical error
        
        rows[stat + offset][index] = int(rows[stat + offset][index]) + 1

    with open('database.csv', 'w') as file:
        write = csv.writer(file, delimiter=',', quoting=csv.QUOTE_NONE)

        write.writerows(rows)

        
cgitb.enable()

data = cgi.FieldStorage()

recordGuess(data.getvalue('horse'), 'horse')
recordGuess(data.getvalue('weed'), 'weed')
recordGuess(data.getvalue('mind'), 'mind')

print "Content-type: text/html"
print
print "Update OK"
