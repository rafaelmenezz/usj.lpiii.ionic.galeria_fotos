import { ref, onMounted, watch } from 'vue';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Storage } from '@capacitor/storage'
import { UserPhoto } from '@/composables/userPhotos'
import { Capacitor } from '@capacitor/core';


export function usePhotoGallery() {

   const photos = ref<UserPhoto[]>([]);
   const PHOTO_STORAGE = "photos";


   const convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
         resolve(reader.result);
      };
      reader.readAsDataURL(blob);
   });

   const savePicture = async (photo: Photo, fileName: string): Promise<UserPhoto> => {

      const file = await Filesystem.readFile({
         path: photo.path!
      });
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();
      const base64Data = await convertBlobToBase64(blob) as string;


      const savedFile = await Filesystem.writeFile({
         path: fileName,
         data: base64Data,
         directory: Directory.Data
      });

      return {
         filepath: savedFile.uri,
         webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };

   }

   const cachePhotos = () => {
      Storage.set({
         key: PHOTO_STORAGE,
         value: JSON.stringify(photos.value)
      });
   }

   const loadSaved = async () => {
      const photoList = await Storage.get({ key: PHOTO_STORAGE });
      const photosInStorage = photoList.value ? JSON.parse(photoList.value) : [];



      for (const photo of photosInStorage) {
         const file = await Filesystem.readFile({
            path: photo.filepath,
            directory: Directory.Data
         });

         photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
      }



      photos.value = photosInStorage;
   }

   const takePhoto = async () => {
      const cameraPhoto = await Camera.getPhoto({
         resultType: CameraResultType.Uri,
         source: CameraSource.Camera,
         quality: 100
      });

      const fileName = new Date().getTime() + '.jpeg';
      const savedFileImage = {
         filepath: fileName,
         webviewPath: cameraPhoto.webPath
      };

      photos.value = [savedFileImage, ...photos.value];

   };


   watch(photos, cachePhotos);
   onMounted(loadSaved);
   return {
      photos,
      takePhoto
   };
}