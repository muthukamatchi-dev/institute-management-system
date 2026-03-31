import java.sql.*;

public class DbDump {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/institute_db?useSSL=false&allowPublicKeyRetrieval=true";
        String user = "root";
        String password = "";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            ResultSet rs = stmt.executeQuery("SELECT id, title, (SELECT COUNT(*) FROM exam_questions WHERE exam_id = exams.id) as qcount FROM exams");
            System.out.println("--- Exams ---");
            while (rs.next()) {
                System.out.println("ID: " + rs.getLong("id") + ", Title: " + rs.getString("title") + ", Questions: " + rs.getInt("qcount"));
            }

            rs = stmt.executeQuery("SELECT question_id, question_text FROM exam_questions LIMIT 5");
            System.out.println("--- Questions ---");
            while (rs.next()) {
                System.out.println("QID: " + rs.getLong("question_id") + " (Wait, is it question_id or id?), Text: " + rs.getString("question_text"));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
