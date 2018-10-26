/** IMPORTS **/

const sharp   = require('sharp');
const path    = require('path');
const fs      = require('fs');
const Export  = require(path.join(__dirname, 'export.js'));

let options;

process.on('message', async function (packet) {
  if (packet.code === 'EXIT') {
    process.exit(0);
  } else if (packet.code === 'SETUP') {

    options = packet.data;
    sharp.concurrency(1);  // Only permit one thread

  } else if (packet.code === 'TASK') {
    let result;

    if (!options) {
      result = {code: 'NOPT', data: packet.data};
    } else {

      try {

        exp = await process_image(packet.data, options);

        result = { code: 'OK', data: exp };
      } catch (err) {
        if (err instanceof Error) err = new_error(err);
        result = {code: 'ERROR', data: packet.data, error: err};
      }

    }

    process.send(result);
  }
});


/**
 * Decode and convert the specified image according to passed options
 *
 * @param {String} image_path The path of the image to process
 * @param {Object} options An Options object
 * @returns {Object} An object summarising the export of the image
 * @throws An error if the file was unable to be decoded/converted
 */
async function process_image(image_path, options) {

  const input_path = path.resolve(options.input);               // The input directory
  const output_path = path.resolve(options.output);             // The output directory
  const image_parse = path.parse(image_path);                   // The input image parsed path
  const relative_path = path.relative(input_path, image_path);  // Get the relative path to input/output
  const export_path = path.join(output_path, relative_path);    // Export path
  const export_parse = path.parse(export_path);                 // To remove the extention


  // If the file is a SVG image, copy it over and return the export
  if (image_parse.ext.toLowerCase() === 'svg') {

    const read_stream = fs.createReadStream(image_path);
    read_stream.once('error', () => { throw {reason: "Failed to open read_stream for image"} } );
    read_stream.pipe(
      fs.createWriteStream(export_path).once('finish', () => {
        return new Export(image_parse.name, image_parse.ext, 'single', relative_path);
      })
    );

  }

  // Try to decode the image metadata, or throw an error
  let metadata;
  try {
    metadata = await sharp(image_path).metadata();
  } catch (err) {
    throw {reason: "Failed to read image metadata", file: image_path, error: new_error(err)};
  }

  // Try to decode the image and return raw image data
  let image_buffer;
  try {
    image_buffer = await sharp(image_path).raw().toBuffer({resolveWithObject: true});
  } catch (err) {
    throw {reason: "Failed to decode the image", file: image_path, error: new_error(err)};
  }


  // Process each export sequentially
  const number_exports = options.exports.length;
  let exported_sizes = [];
  let previous_export = null;
  for (let i = 0; i !== number_exports; i++) {

    const current_export = options.exports[i];

    // Calculate whether the export should be processed, or if it will be a duplicate
    let should_export = false;
    if (i === 0 || current_export['force'] === true) {
      // If it's the first export or it should be forced
      should_export = true;

    } else if (previous_export && ((metadata.width > previous_export.width || metadata.height > previous_export.height))) {
      // If it won't result in a duplicate image
      should_export = true;
    }


    if (should_export) {

      let resized_image_buffer;

      // Resize the image
      try {
        const raw_info = {
          raw: {
            width: image_buffer.info.width,
            height: image_buffer.info.height,
            channels: image_buffer.info.channels
          }
        };
        resized_image_buffer = await sharp(image_buffer.data, raw_info).resize(current_export.width, current_export.height, { withoutEnlargement: true, fit: 'inside' }).toBuffer({resolveWithObject: true});
      } catch (err) {
        throw {reason: "Failed to resize the image", file: image_path, error: new_error(err)};
      }


      // Save it
      try {

        const webp_path = path.join(export_parse.dir, export_parse.name + '_' + current_export.name + '.webp');
        const fallback_path = path.join(export_parse.dir, export_parse.name + '_' + current_export.name + '.' + export_parse.ext);

        // Conver to webp
        const raw_info = {
          raw: {
            width: resized_image_buffer.info.width,
            height: resized_image_buffer.info.height,
            channels: resized_image_buffer.info.channels
          }
        };
        if (!fs.existsSync(export_parse.dir)) fs.mkdirSync(export_parse.dir, { recursive: true });
        await sharp(resized_image_buffer.data, raw_info).webp().toFile(webp_path);
        await sharp(resized_image_buffer.data, raw_info).toFormat(metadata.format).toFile(fallback_path);

        // Push the export to the exported_sizes array
        const to_push = {name: current_export.name, width: current_export.width, height: current_export.height};
        to_push['webp'] = path.relative(output_path, webp_path);
        to_push['fallback'] = path.relative(output_path, fallback_path);
        current_export['default'] === true ? to_push['default'] = true : null;

        exported_sizes.push();

      } catch (err) {
        throw {reason: "Failed to save the image", file: image_path, error: new_error(err)};
      }

      resized_image_buffer = null;  // Free memory

    }

    previous_export = current_export;

  }

  image_buffer = null;  // Free memory

  // Export complete
  return new Export(image_parse.name, image_parse.ext, 'multiple', null, exported_sizes);

}

function new_error(err) {
  return { name: err.name, stack: err.stack, fileName: err.fileName, lineNumber: err.lineNumber, columnNumber: err.columnNumber};
}
