package com.institute.tenant;

import com.zaxxer.hikari.HikariDataSource;
import org.hibernate.engine.jdbc.connections.spi.MultiTenantConnectionProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class MultiTenantConnectionProviderImpl implements MultiTenantConnectionProvider<Object> {

    @Value("${spring.datasource.url}")
    private String baseUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Value("${spring.datasource.driver-class-name}")
    private String driverClassName;

    private final Map<Object, DataSource> tenantDataSources = new ConcurrentHashMap<>();

    @Override
    public Connection getAnyConnection() throws SQLException {
        return getConnection("default");
    }

    @Override
    public void releaseAnyConnection(Connection connection) throws SQLException {
        connection.close();
    }

    @Override
    public Connection getConnection(Object tenantIdentifier) throws SQLException {
        DataSource dataSource = tenantDataSources.computeIfAbsent(tenantIdentifier, this::createDataSourceForTenant);
        return dataSource.getConnection();
    }

    @Override
    public void releaseConnection(Object tenantIdentifier, Connection connection) throws SQLException {
        connection.close();
    }

    @Override
    public boolean supportsAggressiveRelease() {
        return false;
    }

    @Override
    public boolean isUnwrappableAs(Class<?> unwrapType) {
        return false;
    }

    @Override
    public <T> T unwrap(Class<T> unwrapType) {
        return null;
    }

    private DataSource createDataSourceForTenant(Object tenantIdentifier) {
        String tenantId = tenantIdentifier.toString();
        String dbName = tenantId.equals("default") ? "institute_db" : tenantId;
        String url;
        
        if (baseUrl.contains("institute_db")) {
            url = baseUrl.replace("institute_db", dbName);
        } else {
            url = baseUrl.endsWith("/") ? baseUrl + dbName : baseUrl + "/" + dbName;
        }

        HikariDataSource hikari = new HikariDataSource();
        hikari.setJdbcUrl(url);
        hikari.setUsername(username);
        hikari.setPassword(password);
        hikari.setDriverClassName(driverClassName);
        hikari.setMaximumPoolSize(10);
        hikari.setIdleTimeout(300000);
        hikari.setPoolName("Hikari-Pool-" + tenantId);
        
        return hikari;
    }
}
