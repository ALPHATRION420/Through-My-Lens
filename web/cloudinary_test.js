import { v2 as cloudinary } from 'cloudinary';

// 1. Configure Cloudinary inline
cloudinary.config({ 
  cloud_name: 'dokxmhleq', 
  api_key: '978733824647961', 
  api_secret: 'tPuC7cR4aVsjM_w12ZkFyhTevBU' 
});

try {
  // 2. Upload a sample image from Cloudinary's demo domains
  console.log("Uploading sample image...");
  const uploadResult = await cloudinary.uploader.upload("https://res.cloudinary.com/demo/image/upload/sample.jpg");
  console.log("Secure URL:", uploadResult.secure_url);
  console.log("Public ID:", uploadResult.public_id);

  // 3. Get image details (metadata)
  console.log("--- Image Details ---");
  console.log("Width:", uploadResult.width);
  console.log("Height:", uploadResult.height);
  console.log("Format:", uploadResult.format);
  console.log("File Size (bytes):", uploadResult.bytes);

  // 4. Transform the image
  // f_auto (fetch_format: 'auto') - Automatically selects the most optimized format (e.g. webp, avif) supported by the user's browser.
  // q_auto (quality: 'auto') - Automatically adjusts image quality to minimize file size while maintaining visual fidelity.
  const transformedUrl = cloudinary.url(uploadResult.public_id, {
    fetch_format: 'auto',
    quality: 'auto',
    secure: true
  });

  console.log("\nDone! Click link below to see optimized version of the image. Check the size and the format.");
  console.log(transformedUrl);
} catch (error) {
  console.error("Cloudinary operation failed:", error);
}
