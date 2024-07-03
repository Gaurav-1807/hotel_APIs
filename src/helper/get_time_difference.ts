export function getTimeDifference(date1: string = new Date().toISOString().split('T')[0], date2: string = "", isExp: boolean = false): string | boolean {
  const dateObj1 = new Date(date1);
  const dateObj2 = date2 ? new Date(date2) : new Date();
  
  const diffTime = Math.abs(dateObj2.getTime() - dateObj1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const year = Math.floor(diffDays / 365);
  const month = Math.floor((diffDays % 365) / 30);
  const days = diffDays % 30;
  
  let res: string | boolean;
  
  if (year >= 1 && year < 5) {
      if (month === 0) {
          res = `${year} Year(s)`;
      } else {
          const fraction = Math.floor((10 * month) / 12);
          res = `${year}.${fraction} Year(s)`;
      }
  } else if (year >= 5) {
      res = `${year} Year(s)`;
  } else if (month >= 1) {
      res = `${month} Month(s)`;
  } else if (days >= 1) {
      res = `${days} Day(s)`;
  } else {
      res = isExp ? false : "0 Day";
  }
  
  return res;
}
