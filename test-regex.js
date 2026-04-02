const checkRegex = /\[CAL_CHECK:([\d-]{10})(?:,(\d+))?\]/;
console.log("[CAL_CHECK:2024-05-01]".match(checkRegex).slice(1));
console.log("[CAL_CHECK:2024-05-01,123]".match(checkRegex).slice(1));

const bookRegex = /\[CAL_BOOK:(?:(\d+),)?([^,]+),([^,]+),([^,]+),?([^\]]*)\]/;
console.log("[CAL_BOOK:2024-05-01 10:00,John Doe,john@test.com,test]".match(bookRegex).slice(1));
console.log("[CAL_BOOK:123,2024-05-01 10:00,John Doe,john@test.com,test]".match(bookRegex).slice(1));
