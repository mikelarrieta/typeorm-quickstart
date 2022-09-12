import "reflect-metadata";
import { Connection, createConnection } from "typeorm";
import { Album } from "./entity/Album";
import { Photo } from "./entity/Photo";
import { PhotoMetadata } from "./entity/PhotoMetadata";

async function insertOnePhoto(connection: Connection) {
	const photo = new Photo();
	photo.name = "Me and Bears";
	photo.description = "I am near polar bears";
	photo.filename = "photo-with-bears.jpg";
	photo.views = 1;
	photo.isPublished = true;

	const photoRepository = connection.getRepository(Photo);
	await photoRepository.save(photo);
}

async function loadOperations(connection: Connection) {
	const photoRepository = connection.getRepository(Photo);

	const allPhotos = await photoRepository.find();
	console.log("All photos from the db: ", allPhotos);

	const firstPhoto = await photoRepository.findOne(1);
	console.log("First photo from the db: ", firstPhoto);

	const meAndBearsPhoto = await photoRepository.findOne({ name: "Me and Bears" });
	console.log("Me and Bears photo from the db: ", meAndBearsPhoto);

	const allViewedPhotos = await photoRepository.find({ views: 1 });
	console.log("All viewed photos: ", allViewedPhotos);

	const allPublishedPhotos = await photoRepository.find({ isPublished: true });
	console.log("All published photos: ", allPublishedPhotos);

	const [photos, photosCount] = await photoRepository.findAndCount();
	console.log("All photos: ", photos);
	console.log("Photos count: ", photosCount);
}

async function updateOnePhoto(connection: Connection) {
	const photoRepository = connection.getRepository(Photo);
	let photoToUpdate = await photoRepository.findOne(1);
	photoToUpdate.name = "Me, my friends and polar bears";
	await photoRepository.save(photoToUpdate);
}

async function removeOnePhoto(connection: Connection) {
	const photoRepository = connection.getRepository(Photo);
	let photoToRemove = await photoRepository.findOne(4);
	await photoRepository.remove(photoToRemove);
}

async function insertOnePhotoAndMetadata(connection: Connection) {
	// create a photo
	let photo = new Photo();
	photo.name = "Me and Bears";
	photo.description = "I am near polar bears";
	photo.filename = "photo-with-bears.jpg";
	photo.views = 1;
	photo.isPublished = true;

	// create a photo metadata
	let metadata = new PhotoMetadata();
	metadata.height = 640;
	metadata.width = 480;
	metadata.compressed = true;
	metadata.comment = "cybershoot";
	metadata.orientation = "portrait";
	metadata.photo = photo; // this way we connect them

	// get entity repositories
	let photoRepository = connection.getRepository(Photo);
	let metadataRepository = connection.getRepository(PhotoMetadata);

	// first we should save a photo
	await photoRepository.save(photo);

	// photo is saved. Now we need to save a photo metadata
	await metadataRepository.save(metadata);
}

async function queryPhotosWithRelations(connection: Connection) {
	const photoRepository = connection.getRepository(Photo);
	const photos = await photoRepository.find({ relations: ["metadata"] });
	console.log(photos);
}

async function queryPhotosWithRelationsQueryBuilder(connection: Connection) {
	const photos = await connection
		.getRepository(Photo)
		.createQueryBuilder("photo")
		.innerJoinAndSelect("photo.metadata", "metadata")
		.getMany();
	console.log(photos);
}

async function insertOnePhotoAndMetadataCascade(connection: Connection) {
	// create photo object
	let photo = new Photo();
	photo.name = "Me and Bears";
	photo.views = 1;
	photo.description = "I am near polar bears";
	photo.filename = "photo-with-bears.jpg";
	photo.isPublished = true;

	// create photo metadata object
	let metadata = new PhotoMetadata();
	metadata.height = 640;
	metadata.width = 480;
	metadata.compressed = true;
	metadata.comment = "cybershoot";
	metadata.orientation = "portrait";

	photo.metadata = metadata; // this way we connect them

	// get repository
	let photoRepository = connection.getRepository(Photo);

	// saving a photo also save the metadata
	await photoRepository.save(photo);

	console.log("Photo is saved, photo metadata is saved too.");
}

async function insertAlbumsAndPhotos(connection: Connection) {
	// create a few albums
	let album1 = new Album();
	album1.name = "Bears";
	await connection.manager.save(album1);

	let album2 = new Album();
	album2.name = "Me";
	await connection.manager.save(album2);

	// create a few photos
	let photo = new Photo();
	photo.name = "Me and Bears";
	photo.description = "I am near polar bears";
	photo.filename = "photo-with-bears.jpg";
	photo.views = 1
	photo.isPublished = true
	photo.albums = [album1, album2];
	await connection.manager.save(photo);
}

async function queryPhotoWithAlbums(connection: Connection) {
	const loadedPhoto = await connection.getRepository(Photo).findOne(8, { relations: ["albums"] });
	console.log(loadedPhoto);
}

async function queryPhotoWithAlbumsQueryBuilder(connection: Connection) {
	const photos = await connection
		.getRepository(Photo)
		.createQueryBuilder("photo")
		.innerJoinAndSelect("photo.metadata", "metadata")
		.leftJoinAndSelect("photo.albums", "album")
		.where("photo.isPublished = true")
		.andWhere("(photo.name = :photoName OR photo.name = :bearName)")
		.orderBy("photo.id", "DESC")
		.skip(0)
		.take(10)
		.setParameters({ photoName: "Me and Bears", bearName: "Bears" })
		.getMany();
	console.log(photos);
}

(async function () {
	let connection: Connection;
	try {
		connection = await createConnection();

		await insertOnePhoto(connection);
		await loadOperations(connection);
		await updateOnePhoto(connection);
		await removeOnePhoto(connection);
		await insertOnePhotoAndMetadata(connection);
		await queryPhotosWithRelations(connection);
		await queryPhotosWithRelationsQueryBuilder(connection)
		await insertOnePhotoAndMetadataCascade(connection);
		await insertAlbumsAndPhotos(connection)
		await queryPhotoWithAlbums(connection);
		await queryPhotoWithAlbumsQueryBuilder(connection);
	} catch (error) {
		console.error(error);
	} finally {
		await connection.close();
	}
})();
