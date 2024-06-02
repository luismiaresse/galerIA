
create view rest.user_data_view as
select distinct u.id, u.username, u.email, m.file as photo
from rest.media m 
	join rest.media_album ma on m.id = ma.media_id 
	join rest.album a on a.id = ma.album_id
	join rest.album_user au on a.id = au.album_id
	join public.auth_user u on u.id = au.user_id
where m.kind = 'profile' and a.name = 'default'
group by u.id, u.username, u.email, m.file


create view rest.user_albums_view as
select u.id, u.username, a.id as album_id, a.name as album_name, a.creationdate, a.lastupdate
from rest.album a
	join rest.album_user au on a.id = au.album_id
	join public.auth_user u on u.id = au.user_id


create view rest.user_media_view as
select u.id, u.username, a.id as album_id, a.name as album_name, m.id as media_id, m.kind, m.file
from rest.media m 
	join rest.media_album ma on m.id = ma.media_id 
	join rest.album a on a.id = ma.album_id
	join rest.album_user au on a.id = au.album_id
	join public.auth_user u on u.id = au.user_id
where kind != 'profile'
order by m.creationdate desc