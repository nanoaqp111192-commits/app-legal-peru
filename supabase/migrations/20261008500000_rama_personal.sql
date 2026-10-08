-- Categoría aparte para los actos de personal (designaciones, ceses, licencias,
-- viajes en comisión de servicios), que antes caían en "otros". No es una rama
-- del derecho: sirve para clasificar las normas del día sin mezclarlas con el resto.
insert into public.ramas (slug, nombre, profundidad, orden)
values ('personal', 'Designaciones y viajes', false, 98)
on conflict (slug) do nothing;
