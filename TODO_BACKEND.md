# 🚀 TODO Backend Spring Boot

Ce document liste toutes les tâches nécessaires pour implémenter le backend Spring Boot et le connecter au frontend Angular.

---

## 📋 Phase 1 : Initialisation du Projet Spring Boot

### 1.1 Créer le projet Spring Boot

```bash
# Option 1 : Via Spring Initializr (https://start.spring.io)
# Options recommandées :
# - Project: Maven
# - Language: Java
# - Spring Boot: 3.2.x (dernière stable)
# - Dependencies: Web, JPA, MySQL/PostgreSQL, Security, Validation, Lombok

# Option 2 : Via CLI
spring init --dependencies=web,jpa,mysql,security,validation,lombok \
  --build=maven \
  --java-version=17 \
  --name=openschool-api \
  openschool-backend
```

### 1.2 Structure du projet

```
openschool-backend/
├── src/main/java/com/ecole/api/
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   ├── JwtConfig.java
│   │   └── CorsConfig.java
│   │
│   ├── model/
│   │   ├── Student.java
│   │   ├── Class.java
│   │   ├── Attendance.java
│   │   ├── Grade.java
│   │   └── User.java
│   │
│   ├── repository/
│   │   ├── StudentRepository.java
│   │   ├── ClassRepository.java
│   │   └── ...
│   │
│   ├── service/
│   │   ├── StudentService.java
│   │   ├── AuthService.java
│   │   └── ...
│   │
│   ├── controller/
│   │   ├── StudentController.java
│   │   ├── AuthController.java
│   │   └── ...
│   │
│   ├── dto/
│   │   ├── StudentDto.java
│   │   ├── LoginRequestDto.java
│   │   └── ...
│   │
│   ├── mapper/
│   │   └── StudentMapper.java
│   │
│   ├── security/
│   │   ├── JwtTokenProvider.java
│   │   └── JwtAuthenticationFilter.java
│   │
│   └── exception/
│       ├── ResourceNotFoundException.java
│       └── GlobalExceptionHandler.java
│
├── src/main/resources/
│   ├── application.yml
│   └── application-dev.yml
│
└── pom.xml
```

---

## 📋 Phase 2 : Configuration de Base

### 2.1 application.yml

```yaml
spring:
  application:
    name: openschool-api
  
  datasource:
    url: jdbc:mysql://localhost:3306/openschool_db
    username: root
    password: your_password
    driver-class-name: com.mysql.cj.jdbc.Driver
  
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true
  
  security:
    jwt:
      secret: YOUR_SECRET_KEY_HERE_MIN_256_BITS
      expiration: 3600000  # 1 heure en ms

server:
  port: 8080
  servlet:
    context-path: /
```

### 2.2 CORS Configuration

**Fichier : `config/CorsConfig.java`**

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:4200") // Angular dev
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

---

## 📋 Phase 3 : Entities JPA

### 3.1 Entity Student

**Fichier : `model/Student.java`**

```java
@Entity
@Table(name = "students")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Student {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String firstName;
    
    @Column(nullable = false)
    private String lastName;
    
    @Column(nullable = false)
    private LocalDate dateOfBirth;
    
    @Column(unique = true)
    private String email;
    
    private String phone;
    private String address;
    
    @ManyToOne
    @JoinColumn(name = "class_id")
    private Class studentClass;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StudentStatus status;  // ACTIVE, INACTIVE, SUSPENDED
    
    @Column(nullable = false)
    private LocalDate enrollmentDate;
    
    // Parent info
    private String parentName;
    private String parentPhone;
    private String parentEmail;
    
    // Timestamps
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

enum StudentStatus {
    ACTIVE, INACTIVE, SUSPENDED
}
```

### 3.2 Autres Entities à Créer

- [ ] **Class.java** (avec liste de Students)
- [ ] **Subject.java** (Matières)
- [ ] **Attendance.java** (Présences)
- [ ] **Grade.java** (Notes)
- [ ] **Payment.java** (Paiements)
- [ ] **User.java** (Utilisateurs avec roles)

---

## 📋 Phase 4 : Spring Security + JWT

### 4.1 Dépendances Maven

Ajouter dans `pom.xml` :

```xml
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.5</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>
```

### 4.2 Security Configuration

**Fichier : `config/SecurityConfig.java`**

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Autowired
    private JwtAuthenticationFilter jwtFilter;
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/teacher/**").hasAnyRole("ADMIN", "TEACHER")
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### 4.3 JWT Token Provider

**Fichier : `security/JwtTokenProvider.java`**

```java
@Component
public class JwtTokenProvider {
    
    @Value("${spring.security.jwt.secret}")
    private String jwtSecret;
    
    @Value("${spring.security.jwt.expiration}")
    private Long jwtExpiration;
    
    public String generateToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);
        
        return Jwts.builder()
                .setSubject(userPrincipal.getId().toString())
                .claim("email", userPrincipal.getEmail())
                .claim("role", userPrincipal.getRole())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();
    }
    
    public Long getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(token)
                .getBody();
        return Long.parseLong(claims.getSubject());
    }
    
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
```

---

## 📋 Phase 5 : Controllers REST

### 5.1 StudentController

**Fichier : `controller/StudentController.java`**

```java
@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "http://localhost:4200")
public class StudentController {
    
    @Autowired
    private StudentService studentService;
    
    @GetMapping
    public ResponseEntity<List<StudentDto>> getAllStudents() {
        return ResponseEntity.ok(studentService.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<StudentDto> getStudentById(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.findById(id));
    }
    
    @PostMapping
    public ResponseEntity<StudentDto> createStudent(@Valid @RequestBody StudentDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(studentService.create(dto));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<StudentDto> updateStudent(
            @PathVariable Long id, 
            @Valid @RequestBody StudentDto dto) {
        return ResponseEntity.ok(studentService.update(id, dto));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        studentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### 5.2 AuthController

**Fichier : `controller/AuthController.java`**

```java
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private JwtTokenProvider tokenProvider;
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDto request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getEmail(),
                request.getPassword()
            )
        );
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);
        
        return ResponseEntity.ok(new LoginResponseDto(token, user, 3600));
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // TODO: Blacklist token ou invalidation
        return ResponseEntity.ok().build();
    }
}
```

### 5.3 Autres Controllers à Créer

- [ ] **ClassController** → `/api/classes`
- [ ] **AttendanceController** → `/api/attendance`
- [ ] **GradeController** → `/api/grades`
- [ ] **PaymentController** → `/api/payments`
- [ ] **DashboardController** → `/api/dashboard/stats`

---

## 📋 Phase 6 : Services

### 6.1 StudentService

**Fichier : `service/StudentService.java`**

```java
@Service
@Transactional
public class StudentService {
    
    @Autowired
    private StudentRepository repository;
    
    @Autowired
    private StudentMapper mapper;
    
    public List<StudentDto> findAll() {
        return repository.findAll().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }
    
    public StudentDto findById(Long id) {
        Student student = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", id));
        return mapper.toDto(student);
    }
    
    public StudentDto create(StudentDto dto) {
        Student student = mapper.toEntity(dto);
        student = repository.save(student);
        return mapper.toDto(student);
    }
    
    public StudentDto update(Long id, StudentDto dto) {
        Student student = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", id));
        
        // Update fields
        student.setFirstName(dto.getFirstName());
        student.setLastName(dto.getLastName());
        // ... autres champs
        
        student = repository.save(student);
        return mapper.toDto(student);
    }
    
    public void delete(Long id) {
        repository.deleteById(id);
    }
}
```

---

## 📋 Phase 7 : Mapper (Entity ↔ DTO)

**Option 1 : MapStruct (recommandé)**

```java
@Mapper(componentModel = "spring")
public interface StudentMapper {
    StudentDto toDto(Student entity);
    Student toEntity(StudentDto dto);
    List<StudentDto> toDtoList(List<Student> entities);
}
```

**Option 2 : Manuel**

```java
@Component
public class StudentMapper {
    public StudentDto toDto(Student entity) {
        // Conversion manuelle
    }
}
```

---

## 📋 Phase 8 : Tests

### 8.1 Tests Unitaires (Service)

```java
@SpringBootTest
class StudentServiceTest {
    
    @Autowired
    private StudentService service;
    
    @Test
    void testFindAll() {
        List<StudentDto> students = service.findAll();
        assertNotNull(students);
    }
    
    // Plus de tests...
}
```

### 8.2 Tests d'Intégration (Controller)

```java
@SpringBootTest
@AutoConfigureMockMvc
class StudentControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    void testGetAllStudents() throws Exception {
        mockMvc.perform(get("/api/students"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
```

---

## 📋 Phase 9 : Intégration Angular ↔ Spring Boot

### 9.1 Côté Angular

**1. Activer l'interceptor JWT**

Dans `app.config.ts` :
```typescript
provideHttpClient(
  withInterceptors([jwtInterceptor])
)
```

**2. Configurer l'URL de l'API**

Dans `environment.development.ts` :
```typescript
apiBaseUrl: 'http://localhost:8080'
```

**3. Remplacer les mock data**

Dans `student.service.ts` :
```typescript
// Avant (mock)
getAll(): Observable<StudentDto[]> {
  return of(this.mockStudents).pipe(delay(500));
}

// Après (backend réel)
getAll(): Observable<StudentDto[]> {
  return this.http.get<StudentDto[]>(`${this.API_URL}`);
}
```

---

## 📋 Checklist Complète

### Backend Spring Boot

- [ ] Initialiser projet Spring Boot
- [ ] Configurer base de données (MySQL/PostgreSQL)
- [ ] Créer toutes les entities JPA
- [ ] Créer repositories JPA
- [ ] Configurer Spring Security
- [ ] Implémenter JWT (génération + validation)
- [ ] Créer tous les controllers REST
- [ ] Créer tous les services métier
- [ ] Créer les DTOs Java
- [ ] Créer les mappers Entity ↔ DTO
- [ ] Configurer CORS
- [ ] Gestion globale des exceptions
- [ ] Tests unitaires (services)
- [ ] Tests d'intégration (controllers)
- [ ] Documentation API (Swagger/OpenAPI)

### Frontend Angular

- [ ] Activer interceptor JWT
- [ ] Configurer apiBaseUrl
- [ ] Remplacer mocks par appels HTTP réels
- [ ] Tester tous les endpoints
- [ ] Gestion d'erreurs HTTP raffinée
- [ ] Refresh token automatique
- [ ] Loading states améliorés
- [ ] Notifications toast (succès/erreur)

### Fonctionnalités Complètes

- [ ] Authentification + JWT fonctionnel
- [ ] CRUD Students
- [ ] CRUD Classes
- [ ] Gestion Attendance
- [ ] Gestion Grades
- [ ] Gestion Payments
- [ ] Dashboard avec stats réelles
- [ ] Portail Parents
- [ ] Module Settings
- [ ] Rapports et exports

---

## 🔗 Ressources Utiles

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring Security Reference](https://docs.spring.io/spring-security/reference/index.html)
- [JWT.io](https://jwt.io/)
- [Baeldung Spring Tutorials](https://www.baeldung.com/spring-tutorial)
- [MapStruct](https://mapstruct.org/)

---

**Bon courage pour l'implémentation ! 🚀**
