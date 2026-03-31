import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DbFixer {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/institute_db?useSSL=false&allowPublicKeyRetrieval=true";
        String user = "root";
        String password = ""; // Assuming default or what's in application.properties

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            String[] tables = {
                "exams", "exam_questions", "exam_options", "exam_assignments", 
                "exam_submissions", "exam_submission_answers"
            };

            for (String table : tables) {
                try {
                    stmt.execute("ALTER TABLE " + table + " MODIFY id BIGINT AUTO_INCREMENT");
                    System.out.println("Fixed AUTO_INCREMENT for " + table);
                } catch (Exception e) {
                    System.err.println("Failed to fix " + table + ": " + e.getMessage());
                }
            }
            
            // Also fix description being null/missing if needed
            // stmt.execute("ALTER TABLE exams MODIFY column description TEXT");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
