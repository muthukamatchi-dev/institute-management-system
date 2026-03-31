package com.institute.repository;

import com.institute.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameAndPassword(String username, String password);
    Optional<User> findByToken(String token);
    Optional<User> findByEmail(String email);
    
    @Query("SELECT u FROM User u JOIN u.role r WHERE " +
           "LOWER(r.roleName) IN ('admin', 'super admin') OR LOWER(u.username) = 'admin'")
    List<User> findAdminUsers();
}
