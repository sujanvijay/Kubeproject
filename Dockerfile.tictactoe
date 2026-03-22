# ---------- Stage 1 : Artifact Stage ----------
FROM alpine:3.19 AS artifact

WORKDIR /app

COPY target/tictactoe-web-1.0.war .


# ---------- Stage 2 : Runtime Stage ----------
FROM tomcat:10-jdk17

RUN rm -rf /usr/local/tomcat/webapps/*

COPY --from=artifact /app/tictactoe-web-1.0.war /usr/local/tomcat/webapps/ROOT.war

EXPOSE 8081

CMD ["catalina.sh", "run"]
