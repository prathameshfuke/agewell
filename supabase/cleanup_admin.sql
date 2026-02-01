-- CLEANUP BROKEN ADMIN
-- Run this before trying to Sign Up via Frontend

DELETE FROM auth.users WHERE email = 'admin@agewell.com';
