-- Script: Cập nhật logo_url mặc định cho toàn bộ branches, departments, specialties
-- Chạy sau khi đã thực hiện migration add_logo_url.sql

UPDATE branches
SET logo_url = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHQ7AXGqNl4CNxMtxquN03ZsS7q-EcOlu_7A&s'
WHERE logo_url IS NULL;

UPDATE departments
SET logo_url = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHQ7AXGqNl4CNxMtxquN03ZsS7q-EcOlu_7A&s'
WHERE logo_url IS NULL;

UPDATE specialties
SET logo_url = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHQ7AXGqNl4CNxMtxquN03ZsS7q-EcOlu_7A&s'
WHERE logo_url IS NULL;
