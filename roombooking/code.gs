// Code.gs - Backend Google Apps Script

// ฟังก์ชันสำหรับแสดงหน้าเว็บ
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('ระบบจองห้องประชุม')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ฟังก์ชันสำหรับบันทึกการจอง
function saveReservation(data) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Reservations');
    
    // ถ้าไม่มีชีท Reservations ให้สร้างใหม่
    if (!sheet) {
      const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Reservations');
      // เพิ่มหัวคอลัมน์
      newSheet.getRange(1, 1, 1, 6).setValues([
        ['วันที่', 'ชื่อห้องที่ต้องการจอง', 'เวลาเริ่มจอง', 'เวลาจบ', 'ชื่อผู้จอง', 'เบอร์ติดต่อกลับ']
      ]);
      newSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
      
      // ตั้งค่า format สำหรับคอลัมน์เวลา
      newSheet.getRange(2, 3, newSheet.getMaxRows() - 1, 2).setNumberFormat('HH:mm');
    }
    
    const targetSheet = sheet || SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Reservations');
    
    // หาแถวถัดไปที่ว่าง
    const lastRow = targetSheet.getLastRow();
    const nextRow = lastRow + 1;
    
    // บันทึกข้อมูล - เก็บเวลาเป็น string format HH:mm
    targetSheet.getRange(nextRow, 1, 1, 6).setValues([[
      data.date,
      data.room,
      data.startTime,  // เก็บเป็น string format HH:mm
      data.endTime,    // เก็บเป็น string format HH:mm
      data.name,
      data.phone
    ]]);
    
    return {
      success: true,
      message: 'บันทึกการจองเรียบร้อยแล้ว'
    };
    
  } catch (error) {
    return {
      success: false,
      message: 'เกิดข้อผิดพลาด: ' + error.toString()
    };
  }
}

// ฟังก์ชันสำหรับดึงข้อมูลการจองตามวันที่และห้อง
function getReservationsByDateAndRoom(date, room) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Reservations');
    
    if (!sheet) {
      console.log('No Reservations sheet found');
      return [];
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      console.log('No data in sheet');
      return [];
    }
    
    // อ่านข้อมูลทั้งหมด
    const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    console.log('Total rows read:', data.length);
    
    // กรองข้อมูลตามวันที่และห้อง
    const reservations = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // ตรวจสอบว่ามีข้อมูลครบถ้วน
      if (!row[0] || !row[1] || row[2] === '' || row[3] === '') {
        console.log(`Row ${i + 2} has incomplete data, skipping`);
        continue;
      }
      
      // แปลงวันที่
      const rowDate = formatDate(new Date(row[0]));
      const roomName = String(row[1]).trim();
      
      console.log(`Row ${i + 2}: Date=${rowDate}, Room=${roomName}, StartTime=${row[2]}, EndTime=${row[3]}`);
      
      // ตรวจสอบว่าตรงกับเงื่อนไขหรือไม่
      if (rowDate === date && roomName === room) {
        // แปลงเวลาให้เป็น string format HH:MM
        let startTime = row[2];
        let endTime = row[3];
        
        // ถ้าเป็น Date object ให้แปลงเป็น string
        if (startTime instanceof Date) {
          startTime = Utilities.formatDate(startTime, Session.getScriptTimeZone(), 'HH:mm');
        } else if (typeof startTime === 'number') {
          // ถ้าเป็นตัวเลข (serial number) แปลงเป็น Date ก่อน
          const tempDate = new Date(startTime);
          startTime = Utilities.formatDate(tempDate, Session.getScriptTimeZone(), 'HH:mm');
        } else {
          // ถ้าเป็น string อยู่แล้ว ให้ตรวจสอบ format
          startTime = String(startTime).trim();
          // ถ้าไม่มี : ให้เพิ่ม :00
          if (startTime.indexOf(':') === -1) {
            startTime = startTime + ':00';
          }
        }
        
        if (endTime instanceof Date) {
          endTime = Utilities.formatDate(endTime, Session.getScriptTimeZone(), 'HH:mm');
        } else if (typeof endTime === 'number') {
          const tempDate = new Date(endTime);
          endTime = Utilities.formatDate(tempDate, Session.getScriptTimeZone(), 'HH:mm');
        } else {
          endTime = String(endTime).trim();
          if (endTime.indexOf(':') === -1) {
            endTime = endTime + ':00';
          }
        }
        
        const reservation = {
          date: rowDate,
          room: roomName,
          startTime: startTime,
          endTime: endTime,
          name: row[4],
          phone: row[5]
        };
        
        console.log('Adding reservation:', reservation);
        reservations.push(reservation);
      }
    }
    
    console.log(`Found ${reservations.length} reservations for ${room} on ${date}`);
    return reservations;
    
  } catch (error) {
    console.error('Error getting reservations:', error);
    return [];
  }
}

// ฟังก์ชันสำหรับดึง time slots ที่ว่าง
function getAvailableTimeSlots(date, room) {
  try {
    // สร้าง time slots ทั้งหมด (8:00 - 16:30 ทุก 30 นาที) 
    // หมายเหตุ: ไม่รวม 17:00 เพราะต้องมีเวลาอย่างน้อย 30 นาทีสำหรับการจอง
    const allSlots = [];
    for (let hour = 8; hour <= 16; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        allSlots.push(time);
      }
    }
    
    console.log('All slots for start time:', allSlots);
    
    // ดึงข้อมูลการจองที่มีอยู่
    const reservations = getReservationsByDateAndRoom(date, room);
    console.log('Reservations found:', reservations);
    
    // สร้าง Set ของ slots ที่ถูกจองแล้ว
    const bookedSlots = new Set();
    
    reservations.forEach(reservation => {
      const startTime = String(reservation.startTime);
      const endTime = String(reservation.endTime);
      
      console.log(`Processing reservation: ${startTime} - ${endTime}`);
      
      // แปลงเวลาเป็นนาที
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      
      // เพิ่ม slots ที่ถูกจองแล้วลงใน Set
      allSlots.forEach(slot => {
        const slotMinutes = timeToMinutes(slot);
        // slot ที่ถูกจองคือ slot ที่อยู่ระหว่าง startTime (รวม) ถึง endTime (ไม่รวม)
        if (slotMinutes >= startMinutes && slotMinutes < endMinutes) {
          bookedSlots.add(slot);
          console.log(`Slot ${slot} is booked`);
        }
      });
    });
    
    console.log('Booked slots:', Array.from(bookedSlots));
    
    // กรอง slots ที่ว่างออกมา
    const availableSlots = allSlots.filter(slot => !bookedSlots.has(slot));
    
    console.log('Available slots:', availableSlots);
    
    return availableSlots;
    
  } catch (error) {
    console.error('Error in getAvailableTimeSlots:', error);
    return [];
  }
}

// ฟังก์ชันสำหรับดึงเวลาสิ้นสุดที่เป็นไปได้
function getAvailableEndTimes(date, room, startTime) {
  try {
    // ตรวจสอบ startTime
    if (!startTime || typeof startTime !== 'string') {
      console.error('Invalid startTime:', startTime);
      return [];
    }
    
    // สร้าง time slots ทั้งหมด
    const allSlots = [];
    for (let hour = 8; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 17 && minute > 0) break;
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        allSlots.push(time);
      }
    }
    
    const startMinutes = timeToMinutes(startTime);
    const reservations = getReservationsByDateAndRoom(date, room);
    
    // หาการจองถัดไปหลังจากเวลาเริ่มต้น
    let nextBookingStart = null;
    reservations.forEach(reservation => {
      const resStartTime = String(reservation.startTime);
      const resStartMinutes = timeToMinutes(resStartTime);
      if (resStartMinutes > startMinutes) {
        if (!nextBookingStart || resStartMinutes < timeToMinutes(nextBookingStart)) {
          nextBookingStart = resStartTime;
        }
      }
    });
    
    // กรองเวลาสิ้นสุดที่เป็นไปได้
    const availableEndTimes = allSlots.filter(slot => {
      const slotMinutes = timeToMinutes(slot);
      
      // ต้องเป็นเวลาหลังจากเวลาเริ่มต้น
      if (slotMinutes <= startMinutes) return false;
      
      // ถ้ามีการจองถัดไป ต้องไม่เกินเวลาเริ่มของการจองถัดไป
      if (nextBookingStart && slotMinutes > timeToMinutes(nextBookingStart)) return false;
      
      return true;
    });
    
    return availableEndTimes;
    
  } catch (error) {
    console.error('Error in getAvailableEndTimes:', error);
    return [];
  }
}

// ฟังก์ชันแปลงเวลาเป็นนาที
function timeToMinutes(time) {
  // ถ้าเป็น Date object
  if (time instanceof Date) {
    return time.getHours() * 60 + time.getMinutes();
  }
  
  // ตรวจสอบว่า time เป็น string หรือไม่
  if (typeof time !== 'string') {
    console.error('Invalid time format:', time);
    return 0;
  }
  
  // ลองแยกด้วย : ก่อน
  if (time.indexOf(':') > -1) {
    const parts = time.split(':');
    if (parts.length === 2) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      
      if (!isNaN(hours) && !isNaN(minutes)) {
        return hours * 60 + minutes;
      }
    }
  }
  
  // ลองแยกด้วย . (กรณีที่อาจเป็น 8.30 แทน 8:30)
  if (time.indexOf('.') > -1) {
    const parts = time.split('.');
    if (parts.length === 2) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      
      if (!isNaN(hours) && !isNaN(minutes)) {
        return hours * 60 + minutes;
      }
    }
  }
  
  console.error('Invalid time format:', time);
  return 0;
}

// ฟังก์ชันแปลงวันที่เป็น string
function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ฟังก์ชันตรวจสอบการจองซ้ำ
function checkDuplicateBooking(date, room, startTime, endTime) {
  const reservations = getReservationsByDateAndRoom(date, room);
  const newStartMinutes = timeToMinutes(startTime);
  const newEndMinutes = timeToMinutes(endTime);
  
  for (const reservation of reservations) {
    const existingStartMinutes = timeToMinutes(reservation.startTime);
    const existingEndMinutes = timeToMinutes(reservation.endTime);
    
    // ตรวจสอบว่ามีการทับซ้อนหรือไม่
    if (
      (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
      (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
      (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes)
    ) {
      return true; // มีการจองซ้ำ
    }
  }
  
  return false; // ไม่มีการจองซ้ำ
}