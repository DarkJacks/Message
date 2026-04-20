FROM ubuntu:latest
LABEL authors="sidor"

ENTRYPOINT ["top", "-b"]