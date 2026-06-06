package ai.arogya.jdbc;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class ArogyaJdbcServer {
  private static final int PORT = Integer.parseInt(env("JDBC_SERVER_PORT", "8081"));
  private static final String JDBC_URL = env("DB_JDBC_URL", "jdbc:h2:file:./data/arogya_ai;AUTO_SERVER=TRUE");
  private static final String JDBC_USER = env("DB_USER", "sa");
  private static final String JDBC_PASSWORD = env("DB_PASSWORD", "");

  public static void main(String[] args) throws Exception {
    initializeDatabase();

    HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
    server.createContext("/api/health", ArogyaJdbcServer::handleHealth);
    server.createContext("/api/register", ArogyaJdbcServer::handleRegister);
    server.createContext("/api/login", ArogyaJdbcServer::handleLogin);
    server.createContext("/api/admin/users", ArogyaJdbcServer::handleAdminUsers);
    server.setExecutor(null);
    server.start();

    System.out.println("Arogya JDBC backend running on http://localhost:" + PORT);
    System.out.println("Using JDBC database: " + JDBC_URL);
  }

  private static void handleHealth(HttpExchange exchange) throws IOException {
    if (handleCors(exchange)) return;
    sendJson(exchange, 200, "{\"ok\":true,\"database\":\"" + escapeJson(JDBC_URL) + "\"}");
  }

  private static void handleRegister(HttpExchange exchange) throws IOException {
    if (handleCors(exchange)) return;
    if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
      sendJson(exchange, 405, "{\"success\":false,\"message\":\"Method not allowed\"}");
      return;
    }

    try {
      Map<String, String> body = parseJsonObject(readBody(exchange));
      String username = clean(body.get("username"));
      String password = body.getOrDefault("password", "");

      if (username.isBlank() || password.isBlank()) {
        sendJson(exchange, 400, "{\"success\":false,\"message\":\"Username and password are required\"}");
        return;
      }
      if (password.length() < 6) {
        sendJson(exchange, 400, "{\"success\":false,\"message\":\"Password must be at least 6 characters long\"}");
        return;
      }
      if ("admin".equalsIgnoreCase(username)) {
        sendJson(exchange, 400, "{\"success\":false,\"message\":\"This username is reserved\"}");
        return;
      }

      try (Connection connection = getConnection()) {
        if (userExists(connection, username)) {
          sendJson(exchange, 409, "{\"success\":false,\"message\":\"An account with this username already exists\"}");
          return;
        }

        try (PreparedStatement statement = connection.prepareStatement(
            "INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, ?)")) {
          statement.setString(1, username);
          statement.setString(2, null);
          statement.setString(3, hashPassword(password));
          statement.setString(4, Instant.now().toString());
          statement.executeUpdate();
        }
      }

      sendJson(exchange, 201, "{\"success\":true,\"message\":\"Account created successfully!\",\"user\":{\"username\":\""
          + escapeJson(username) + "\"}}");
    } catch (Exception error) {
      sendJson(exchange, 500, "{\"success\":false,\"message\":\"Registration failed: " + escapeJson(error.getMessage()) + "\"}");
    }
  }

  private static void handleLogin(HttpExchange exchange) throws IOException {
    if (handleCors(exchange)) return;
    if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
      sendJson(exchange, 405, "{\"success\":false,\"message\":\"Method not allowed\"}");
      return;
    }

    try {
      seedAdmin();
      Map<String, String> body = parseJsonObject(readBody(exchange));
      String emailOrUsername = clean(body.get("emailOrUsername"));
      String password = body.getOrDefault("password", "");

      try (Connection connection = getConnection();
           PreparedStatement statement = connection.prepareStatement(
               "SELECT username, email, password_hash FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?")) {
        String lookup = emailOrUsername.toLowerCase(Locale.ROOT);
        statement.setString(1, lookup);
        statement.setString(2, lookup);

        try (ResultSet rows = statement.executeQuery()) {
          if (!rows.next() || !hashPassword(password).equals(rows.getString("password_hash"))) {
            sendJson(exchange, 401, "{\"success\":false,\"message\":\"Invalid username/email or password\"}");
            return;
          }

          String username = rows.getString("username");
          String email = rows.getString("email");
          String emailJson = email == null ? "null" : "\"" + escapeJson(email) + "\"";
          sendJson(exchange, 200, "{\"success\":true,\"message\":\"Logged in successfully!\",\"user\":{\"username\":\""
              + escapeJson(username) + "\",\"email\":" + emailJson + "}}");
        }
      }
    } catch (Exception error) {
      sendJson(exchange, 500, "{\"success\":false,\"message\":\"Login failed: " + escapeJson(error.getMessage()) + "\"}");
    }
  }

  private static void handleAdminUsers(HttpExchange exchange) throws IOException {
    if (handleCors(exchange)) return;
    if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
      sendJson(exchange, 405, "{\"success\":false,\"message\":\"Method not allowed\"}");
      return;
    }

    try {
      seedAdmin();
      List<String> users = new ArrayList<>();
      try (Connection connection = getConnection();
           PreparedStatement statement = connection.prepareStatement(
               "SELECT username, email, created_at FROM users ORDER BY created_at DESC");
           ResultSet rows = statement.executeQuery()) {
        while (rows.next()) {
          String email = rows.getString("email");
          users.add("{\"username\":\"" + escapeJson(rows.getString("username")) + "\",\"email\":"
              + (email == null ? "null" : "\"" + escapeJson(email) + "\"")
              + ",\"createdAt\":\"" + escapeJson(rows.getString("created_at")) + "\",\"sessions\":[]}");
        }
      }
      sendJson(exchange, 200, "{\"success\":true,\"users\":[" + String.join(",", users) + "]}");
    } catch (Exception error) {
      sendJson(exchange, 500, "{\"success\":false,\"message\":\"Could not load users: " + escapeJson(error.getMessage()) + "\"}");
    }
  }

  private static void initializeDatabase() throws SQLException {
    try (Connection connection = getConnection();
         Statement statement = connection.createStatement()) {
      if (isMySql()) {
        statement.execute("""
            CREATE TABLE IF NOT EXISTS users (
              id BIGINT PRIMARY KEY AUTO_INCREMENT,
              username VARCHAR(120) NOT NULL UNIQUE,
              email VARCHAR(255) UNIQUE,
              password_hash VARCHAR(64) NOT NULL,
              created_at VARCHAR(40) NOT NULL
            )
            """);
      } else {
        statement.execute("""
            CREATE TABLE IF NOT EXISTS users (
              id IDENTITY PRIMARY KEY,
              username VARCHAR(120) NOT NULL UNIQUE,
              email VARCHAR(255) UNIQUE,
              password_hash VARCHAR(64) NOT NULL,
              created_at VARCHAR(40) NOT NULL
            )
            """);
      }
    }
    seedAdmin();
  }

  private static void seedAdmin() throws SQLException {
    try (Connection connection = getConnection()) {
      if (userExists(connection, "admin@arogya.ai")) return;
      try (PreparedStatement statement = connection.prepareStatement(
          "INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, ?)")) {
        statement.setString(1, "Admin");
        statement.setString(2, "admin@arogya.ai");
        statement.setString(3, hashPassword("admin"));
        statement.setString(4, Instant.now().toString());
        statement.executeUpdate();
      }
    }
  }

  private static boolean userExists(Connection connection, String usernameOrEmail) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(
        "SELECT 1 FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?")) {
      String lookup = usernameOrEmail.toLowerCase(Locale.ROOT);
      statement.setString(1, lookup);
      statement.setString(2, lookup);
      try (ResultSet rows = statement.executeQuery()) {
        return rows.next();
      }
    }
  }

  private static Connection getConnection() throws SQLException {
    return DriverManager.getConnection(JDBC_URL, JDBC_USER, JDBC_PASSWORD);
  }

  private static boolean isMySql() {
    return JDBC_URL.toLowerCase(Locale.ROOT).startsWith("jdbc:mysql:");
  }

  private static boolean handleCors(HttpExchange exchange) throws IOException {
    exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "http://localhost:9003");
    exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");

    if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
      exchange.sendResponseHeaders(204, -1);
      return true;
    }
    return false;
  }

  private static void sendJson(HttpExchange exchange, int status, String json) throws IOException {
    byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
    exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
    exchange.sendResponseHeaders(status, bytes.length);
    try (OutputStream output = exchange.getResponseBody()) {
      output.write(bytes);
    }
  }

  private static String readBody(HttpExchange exchange) throws IOException {
    try (InputStream input = exchange.getRequestBody()) {
      return new String(input.readAllBytes(), StandardCharsets.UTF_8);
    }
  }

  private static Map<String, String> parseJsonObject(String json) {
    Map<String, String> values = new LinkedHashMap<>();
    String trimmed = json == null ? "" : json.trim();
    if (trimmed.startsWith("{")) trimmed = trimmed.substring(1);
    if (trimmed.endsWith("}")) trimmed = trimmed.substring(0, trimmed.length() - 1);

    boolean inString = false;
    boolean escaping = false;
    StringBuilder token = new StringBuilder();
    List<String> pairs = new ArrayList<>();

    for (int index = 0; index < trimmed.length(); index++) {
      char character = trimmed.charAt(index);
      if (escaping) {
        token.append(character);
        escaping = false;
      } else if (character == '\\') {
        token.append(character);
        escaping = true;
      } else if (character == '"') {
        token.append(character);
        inString = !inString;
      } else if (character == ',' && !inString) {
        pairs.add(token.toString());
        token.setLength(0);
      } else {
        token.append(character);
      }
    }
    if (!token.isEmpty()) pairs.add(token.toString());

    for (String pair : pairs) {
      int separator = pair.indexOf(':');
      if (separator <= 0) continue;
      values.put(unquote(pair.substring(0, separator).trim()), unquote(pair.substring(separator + 1).trim()));
    }
    return values;
  }

  private static String unquote(String value) {
    String trimmed = value.trim();
    if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
      trimmed = trimmed.substring(1, trimmed.length() - 1);
    }
    return trimmed
        .replace("\\\"", "\"")
        .replace("\\\\", "\\")
        .replace("\\n", "\n")
        .replace("\\r", "\r")
        .replace("\\t", "\t");
  }

  private static String hashPassword(String password) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
      StringBuilder output = new StringBuilder();
      for (byte b : hash) {
        output.append(String.format("%02x", b));
      }
      return output.toString();
    } catch (Exception error) {
      throw new IllegalStateException("Could not hash password", error);
    }
  }

  private static String clean(String value) {
    return value == null ? "" : value.trim();
  }

  private static String escapeJson(String value) {
    if (value == null) return "";
    return value
        .replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
        .replace("\t", "\\t");
  }

  private static String env(String name, String fallback) {
    String value = System.getenv(name);
    return value == null || value.isBlank() ? fallback : value;
  }
}
