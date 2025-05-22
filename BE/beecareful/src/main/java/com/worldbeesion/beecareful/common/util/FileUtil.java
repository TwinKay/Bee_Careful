package com.worldbeesion.beecareful.common.util;

import java.util.List;

import org.springframework.util.StringUtils;

import com.worldbeesion.beecareful.common.exception.BadRequestException;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class FileUtil {
    /**
     * Validates the file extension from a given filename.
     *
     * @param filename The full filename (e.g., "image.jpg").
     * @return The lowercased file extension if valid.
     * @throws BadRequestException if the extension is missing or not allowed.
     */
    public static String validateFileExtension(String filename, List<String> allowedExtensions) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            log.error("Filename is null or missing extension: {}", filename);
            // Or throw a specific exception like InvalidFilenameException
            throw new BadRequestException();
        }

        // Extract extension using StringUtils for robustness
        String fileExtension = StringUtils.getFilenameExtension(filename);

        if (fileExtension == null || fileExtension.isEmpty()) {
            log.error("Could not extract extension from filename: {}", filename);
            throw new BadRequestException();
        }

        fileExtension = fileExtension.toLowerCase(); // Normalize to lower case for comparison

        if (!allowedExtensions.contains(fileExtension)) {
            log.error("Unsupported file extension: {}. Allowed extensions: {}", fileExtension, allowedExtensions);
            // TODO: Throw a more specific exception if available
            // throw new ImageExtensionNotSupportedException("Unsupported file extension: " + fileExtension);
            throw new BadRequestException();
        }
        return fileExtension;
    }

}
