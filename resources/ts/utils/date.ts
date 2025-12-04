import moment from 'jalali-moment'

/**
 * تبدیل تاریخ میلادی به شمسی
 */
export const formatToJalali = (dateString: string): string => {
  if (!dateString) return ''
  try {
    // استفاده از jalali-moment برای تبدیل تاریخ میلادی به شمسی
    const momentDate = moment(dateString, 'YYYY-MM-DD')
    if (momentDate.isValid()) {
      return momentDate.format('jYYYY/jMM/jDD')
    }
    return dateString
  } catch (error) {
    console.error('Error converting date to jalali:', error)
    return dateString
  }
}

/**
 * فرمت کردن تاریخ شمسی به فرمت روز/ماه/سال
 * ورودی می‌تواند به فرمت Y/m/d یا Y-m-d باشد
 */
export const formatShamsiDate = (dateString: string): string => {
  if (!dateString) return ''
  try {
    // اگر تاریخ به فرمت ISO با timestamp است، فقط قسمت تاریخ را بگیر
    let datePart = dateString
    if (dateString.includes('T')) {
      datePart = dateString.split('T')[0]
    }
    
    // اگر تاریخ به فرمت Y/m/d است، آن را به d/m/Y تبدیل کن
    if (datePart.includes('/')) {
      const parts = datePart.split('/')
      if (parts.length === 3) {
        // فرمت: Y/m/d -> d/m/Y
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
    }
    
    // اگر تاریخ به فرمت Y-m-d است، ابتدا به Y/m/d تبدیل کن سپس به d/m/Y
    if (datePart.includes('-')) {
      const parts = datePart.split('-')
      if (parts.length === 3) {
        // فرمت: Y-m-d -> d/m/Y
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
    }
    
    // اگر فرمت دیگری است، سعی کن با moment آن را parse کن
    const momentDate = moment(datePart, ['YYYY-MM-DD', 'jYYYY/jMM/jDD', 'jYYYY-jMM-jDD'], true)
    if (momentDate.isValid()) {
      return momentDate.format('jDD/jMM/jYYYY')
    }
    
    return dateString
  } catch (error) {
    console.error('Error formatting shamsi date:', error)
    return dateString
  }
}


