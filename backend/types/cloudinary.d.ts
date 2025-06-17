declare module 'cloudinary' {
  export const v2: {
    config: (options: {
      cloud_name: string | undefined;
      api_key: string | undefined;
      api_secret: string | undefined;
      secure?: boolean;
    }) => void;
    uploader: {
      upload: (
        filePath: string,
        options: {
          folder: string | undefined;
          resource_type: 'image' | 'video' | 'raw' | 'auto';
        }
      ) => Promise<{ secure_url: string; [key: string]: any }>;
      destroy: (publicId: string) => Promise<any>;
    };

  };


}
