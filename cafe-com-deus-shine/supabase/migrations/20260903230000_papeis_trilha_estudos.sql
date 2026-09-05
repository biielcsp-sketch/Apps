-- Papéis novos (co-líder e anfitriã). ALTER TYPE ... ADD VALUE precisa
-- estar commitado antes de ser usado, por isso vive numa migration própria.
alter type user_role add value if not exists 'co_lider';
alter type user_role add value if not exists 'anfitria';
