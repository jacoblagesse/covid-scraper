function scrapeData() {
  const url = 'https://renewal.missouri.edu/student-cases/';
  const content = UrlFetchApp.fetch(url).getContentText();
  const $ = Cheerio.load(content);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const sheet1 = ss.getSheets()[0];
  const sheet2 = ss.getSheets()[1];
  
  const studentData = scrapeStudents($, sheet1);
  const staffData = scrapeStaff($, sheet2);
  
  var date = Utilities.formatDate(new Date(), 'CST', 'MM/dd');
  
  studentData.unshift(date);
  staffData.unshift(date);
  
  if (hasDiffs(studentData, staffData, sheet1, sheet2)) {
    sheet1.appendRow(studentData);
    sheet2.appendRow(staffData);
    return 1;
  } else {return 0;}
}

function scrapeStudents($, sheet) {
  let studentData = [3, 0, 2, 1, 4];
  let scrapedData = [];
  $('div .renew-case-numbers-card').each(function(i) {
    let item = $('div .renew-case-numbers-card').eq(i).text().trim();
    item = item.slice(0, item.indexOf('\n'));
    scrapedData.push(item);
  });
  
  // Order data for spreadshet entry
  scrapedData.forEach(function(item, idx) {
    studentData.forEach(function(d, i) {
      if (idx === d) {
        studentData[i] = scrapedData[idx];
      };
    });
  });
    
  studentData.splice(2, 0, getStudentCaseChange(sheet, studentData[0]));
  
  // Logger.log(studentData);
  
  return studentData;
}

// Evaluate change in total cases
function getStudentCaseChange(sheet, newCaseTotal) {
  let lastRow = sheet.getLastRow();
  let lastCaseTotal = sheet.getRange(lastRow, 2).getValue();
  return newCaseTotal - +lastCaseTotal;
}

// Scrapes staff table and formats data
function scrapeStaff($, sheet) {
  staffData = [];
  let tds = $('table > tbody > tr > td').map(function () {
      return $(this).text().trim().slice(0, $(this).text().trim().indexOf('*'));
    }).get();
  staffData = tds.slice(9, 18);
  
  // Order data for spreadsheet entry
  staffData.forEach(function(d, i) {
    if ((i+1) % 3 === 0) {
      staffData.splice(i,1);
      staffData.splice(i-2,0,d);
    }
  });
  
  staffData = getStaffCaseChange(sheet, staffData);
  
  // Calculates totals
  let i;
  staffData.unshift(0,0,0,0);
  for(i = 0; i < staffData.length; i++) {
    switch ((i+4) % 4) {
      case 0:
        staffData[0] += +staffData[i];
        break;
      case 1:
        staffData[1] += +staffData[i];
        break;
      case 2:
        staffData[2] += +staffData[i];
        break;
      case 3:
        staffData[3] += +staffData[i];
        break;
    }
  };
  
  // Logger.log(staffData);
  return staffData;
}

// Calculates changes in staff cases
function getStaffCaseChange(sheet, staffData) {
  let totalLocs = [6, 10, 14];
  let lastRow = sheet.getLastRow();
  
  let k = 0;
  totalLocs.forEach(function(d, i) {
    let cases = staffData[i*3+k] - +(sheet.getRange(lastRow, d).getValue());
    staffData.splice((i*3)+3+k, 0, cases);
    k++;
  });
  
  return staffData;
}

// Determines if the data itself has updated and not just the page HTML
function hasDiffs(studentData, staffData, sheet1, sheet2) {
  var has_diffs = false;
  for (let i = 0; i < studentData.length; i++) {
    if (!(i === 0 || i === 3 || i === 5) && studentData[i] != sheet1.getRange(sheet1.getLastRow(), i+1).getValue()){
      has_diffs = true;
    }
    // Logger.log(has_diffs)
  }
  for (let i = 0; i < staffData.length; i++) {
    if (!(i % 4 === 0 || i === 0) && staffData[i] != sheet2.getRange(sheet2.getLastRow(), i+1).getValue()){
      has_diffs = true;
    }
  }
  return has_diffs;
}