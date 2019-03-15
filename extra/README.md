# Implementation Examples

## Proof of concept

The source files in this directory are the different implementations of Responsive Image Builder that I have used in some of my
projects.

I have tried with my best efforts to keep them relevant with the latest version of Responsive Image Builder, however they may no longer follow the best Angular/React design principles.

Resolving images is difficult to do correctly in modern web practices, as most frameworks and languages tend to enforce a modular code system, which is great, don't get me wrong. Images, however, are more often stored in a central location, who's global-state can be difficult to combat in code.

In outdated code, image URLs were hard-coded to locations. My approach is to assign a unique identifier to an image (the name) with variable image sizes and codecs available. This requires a *global* manifest file, that makes it difficult to create a modular system like in React.

### Angular and JS

In **Angular** and **JS**, my approach was to create a singleton class that handles Image Resolution. Angular is very kind towards singleton services, which is perfect for my needs. These singleton classes maintain a cache that improve their performance and reduce useless calculations. Being the single point of truth, they can also have the base URL hard-coded or referenced in an easy modifiable way.

### React

**React** is slightly more difficult, with it's component like nature. Each image object should be a "dump component" that only displays an image based on input properties, which requires some sort of images resolver. As the Angular service equivalent doesn't exist, and is frowned upon by the React community, I decided to go for a Higher Order Component. The down-side to this is of course that there are no performance optimizations. Furthermore, asynchronous Modernizr WebP detection was no longer really an option... Thankfully there seems to be a JS-less solution to smart WebP based images using `<picture>` and `<source>`. Each image has to have a full-blown image resolver and its own copy of the manifest (without some tricky central store using Redux or Providers). Being new to React and having a small project, I leveraged the power of a custom manifest-serving provider, but having a cache is not feasible, as updating the cache would force a re-render of all images without even more code logic...

### Conclusion

These examples are a proof of concept, and not recommended for use. They should serve as an example, or a template to get you started.

If you have any better ideas on how to achieve image resolution in an ingenious way while respecting best practices, submit a Pull Request or send me a message.