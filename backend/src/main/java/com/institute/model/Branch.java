package com.institute.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import java.time.LocalDateTime;

@Entity
@Table(name = "branches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class Branch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 50)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 20)
    private String pincode;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    // Important: with a boolean field named "isMain", JavaBeans tooling can treat the JSON
    // property name as "main" (getter: isMain, setter: setMain). Our Angular app uses
    // "isMain", so we explicitly bind/serialize as "isMain" and also accept "main".
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    @Column(name = "is_main")
    private boolean isMain;

    @JsonProperty("isMain")
    public boolean isMain() {
        return isMain;
    }

    @JsonProperty("isMain")
    @JsonAlias({"main"})
    public void setMain(boolean main) {
        this.isMain = main;
    }

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "status")
    private String status; // Active, Inactive

    @Builder.Default
    @Column(name = "tenant_id", length = 100)
    private String tenantId = "default";
}
