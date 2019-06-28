![Docker Automated build](https://img.shields.io/docker/cloud/automated/skjnldsv/npmbuildbot.svg?style=flat-square&logo=docker)
![Docker Automated build](https://img.shields.io/docker/cloud/build/skjnldsv/npmbuildbot.svg?style=flat-square&logo=docker)

![github app command](https://img.shields.io/badge/command-%2Fcompile%20%2Fpath%2Fto%2Fassets-red.svg?style=flat-square&logo=github)
![github amend command](https://img.shields.io/badge/command-%2Fcompile%20amend%20%2Fpath%2Fto%2Fassets-red.svg?style=flat-square&logo=github)
![github fixup command](https://img.shields.io/badge/command-%2Fcompile%20fixup%20%2Fpath%2Fto%%2Fassets-red.svg?style=flat-square&logo=github)
# npmbuildbot

A GitHub App built with [Probot](https://github.com/probot/probot) that A probot app that tries to compile npm assets and commit them
- You can request a compilation and the bot will compile and try to add the requested path if it contains changes, this will create a new commit.
- You can also request a `fixup` that will add a new fixup commit for the previous one (`HEAD`). 
- Finally, you can also request an amend commit and it will force push to your branch.


## Setup

1. create a github app
2. generate a webhook secret `openssl rand -base64 32`
3. generate a private key
4. replace the data by yours in the `docker-compose.yml` file
5. replace the content of the fake private key `private-key.pem` by yours
6. run the bot `docker-compose up` (`-d` to run in background)
7. put your direct url access to your bot in your github app config

## Contributing

If you have suggestions for how backport could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2019 John Molakvoæ <skjnldsv@protonmail.com>
