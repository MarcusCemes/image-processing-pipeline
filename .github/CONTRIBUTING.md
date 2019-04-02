# Contributing

**Working on your first Pull Request?** You can learn how from this *free* series [How to Contribute to an Open Source Project on GitHub](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github)

When contributing to this repository, please first discuss the change you wish to make via issue,
email, or any other method with the owners of this repository before making a change. You wouldn't
want your work to be for nothing if the change was already being implemented, would you?

## Make your own personal copy

Fork and clone the repository to your computer with git.

The source files are found under `src/`. You may make any changes, commit them, and generally do what you like in your own personal copy.

There are a few scripts to you to help you out:

```bash
$ npm test
$ npm run watch  # live compilation
$ npm run build  # final build
$ npm run fix    # linting and style fixing
$ npm run reset  # reset to the last commit, and lose changes!
```

## Contributing back to RIB

- Fork the repository
- Make your awesome changes
- Update the CHANGELOG and README
- Run tests, make sure they pass
- Use sensible commit messages
  - We recommend [commitizen](https://github.com/commitizen/cz-cli), it's what we use
    - If your commits don't follow [Conventional Commits](https://www.conventionalcommits.org/), we will squash and rename them
  - Include any issue numbers in the message
- Submit a Pull Request
  - Try to follow the given template
  - Add a good description of your changes
  - Don't add too many commits...
  - A PR should only address one issue/feature

### Changelog

This project maintains a human-written changelog. It's easy to maintain, please make sure that you
update it with every commit that produces noticeable modification! It follows the
[Keep a Changelog](https://keepachangelog.com) format.

### Testing

Contributions must pass style and unit tests. The deployment process ia handled by Travis CI, and any non-compliant commits will be rejected.

```bash
$ npm test
```

### The Pull Request

1. Run the tests and verify that your work adheres to the project's guidelines.
2. Update the README if necessary and make sure that you correctly updated the CHANGELOG.
3. Submit a Pull Request using the template provided and a easily-understandable description.

Our commits follow the [Conventional Commits](https://www.conventionalcommits.org/) format. Your
change should only concern itself with a single feature or bug fix, and if possible, the commit
should adhere to the conventional commit standard. A fantastic tool for committing is
[commitizen](https://github.com/commitizen/cz-cli), which is configured to work with this
repository.

If the commits are not compliant with Conventional Commit, don't worry, they will be squashed and
properly tagged by a maintainer.

### [MAINTAINER] Merge

Once the Pull Request has passed the checks, it may be merged into `develop` or `master`. If the
commits do not follow conventional commits, a squash merge is necessary with a compliant commit
message.

### [AUTOMATIC] Deployment

Deployment is automatically handled by Travis CI whenever changes are pushed to the `master` branch
that pass the repository tests.
