
create or replace view public.user_data_view as
select distinct on (u.id) u.id, u.username, u.email, coalesce(m.id) as photoid
from auth_user u
left join album_user au on u.id = au.user_id
left join album a on au.album_id = a.id and a.name = 'default'
left join media_album ma on a.id = ma.album_id
left join media m on ma.media_id = m.id and m.kind = 'profile'
order by u.id desc, coalesce(m.id);


create or replace view public.user_albums_view as
select distinct u.id, u.username, a.id as album_id, a.name as album_name, a.creationdate, a.lastupdate,
count(ma.media_id) over (partition by a.id) as album_elements, (select m.file 
     from public.media_album ma_inner 
     join public.media m on ma_inner.media_id = m.id 
     where ma_inner.album_id = a.id and ma_inner.is_cover = true 
     limit 1) as cover, au.is_owner, a.permissions, a.code
from public.album a
	left join public.album_user au on a.id = au.album_id
	left join public.auth_user u on u.id = au.user_id
	left join public.media_album ma on a.id = ma.album_id;


create or replace view public.user_media_view as
select u.id, u.username, a.id as album_id, a.name as album_name, 
m.id as media_id, ma.is_cover, m.filename, m.kind, m.modificationdate, 
m.coordinates, m.location, m.label, m.detectedobjects, m.file
from public.media m 
	left join public.media_album ma on m.id = ma.media_id 
	left join public.album a on a.id = ma.album_id
	left join public.album_user au on a.id = au.album_id
	left join public.auth_user u on u.id = au.user_id
order by m.modificationdate desc;

