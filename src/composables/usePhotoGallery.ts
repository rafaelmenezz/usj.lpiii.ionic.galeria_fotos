import { ref, onMounted, watch } from 'vue';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Storage } from '@capacitor/storage'
import { UserPhoto } from '@/composables/userPhotos'
import { Capacitor } from '@capacitor/core';


export function usePhotoGallery() {

   const photos = ref<UserPhoto[]>([]);
   const PHOTO_STORAGE = "photos";

   const savePicture = async (photo: Photo, fileName: string): Promise<UserPhoto> => {
      const file = await Filesystem.readFile({
         path: photo.path!
      });


      const base64Data = file.data;

      
      const savedFile = await Filesystem.writeFile({
         path: fileName,
         data: base64Data,
         directory: Directory.Data
      });

      return {
         filepath: savedFile.uri,
         webviewPath: Capacitor.convertFileSrc(savedFile.uri),

      };
   };

   const loadSaved = async () => {
      const photoList = await Storage.get({ key: PHOTO_STORAGE });
      const photosInStorage = photoList.value ? JSON.parse(photoList.value) : [];
      photos.value = photosInStorage;
   };

   const cachePhotos = () => {
      Storage.set({
         key: PHOTO_STORAGE,
         value: JSON.stringify(photos.value)
      });

   }

   const takePhoto = async () => {
      const cameraPhoto = await Camera.getPhoto({
         resultType: CameraResultType.Uri,
         source: CameraSource.Camera,
         quality: 100
      });

      const fileName = new Date().getTime() + '.jpeg';
      const savedFileImage = await savePicture(cameraPhoto, fileName);

      photos.value = [savedFileImage, ...photos.value];
   };

   watch(photos, cachePhotos);

   onMounted(loadSaved);

   return {
      photos,
      takePhoto
   };
}