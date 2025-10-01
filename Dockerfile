FROM ubuntu:latest
LABEL authors="rezax"

ENTRYPOINT ["top", "-b"]