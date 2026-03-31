package com.institute.tenant;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
public class MultiTenantDataSourceConfiguration {

    @Value("${spring.datasource.url}")
    private String baseUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Value("${spring.datasource.driver-class-name}")
    private String driverClassName;

    private final Map<Object, Object> dataSources = new ConcurrentHashMap<>();

    @Bean
    @Primary
    public DataSource dataSource() {
        TenantRoutingDataSource routingDataSource = new TenantRoutingDataSource();
        
        // Create a default data source
        DataSource defaultDataSource = createDataSource("institute_db");
        dataSources.put("default", defaultDataSource);
        
        routingDataSource.setTargetDataSources(dataSources);
        routingDataSource.setDefaultTargetDataSource(defaultDataSource);
        
        return routingDataSource;
    }

    public DataSource createDataSource(String tenantId) {
        // Construct URL based on tenant ID if needed
        // For simplicity, we assume tenantId IS the db name or part of it
        String url = baseUrl.replace("institute_db", tenantId);
        
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        dataSource.setDriverClassName(driverClassName);
        
        return dataSource;
    }

    // Method to add new tenant data source at runtime
    public void addTenantDataSource(String tenantId) {
        if (!dataSources.containsKey(tenantId)) {
            dataSources.put(tenantId, createDataSource(tenantId));
            // Trigger refresh if needed, however RoutingDataSource will look up by key
        }
    }
}
