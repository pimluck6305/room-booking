@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String password;

    // --- One-to-One ---
    // 'mappedBy' บอกว่าฝั่ง UserProfile เป็นเจ้าของ relationship นี้
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private UserProfile userProfile;

    // --- One-to-Many ---
    // User 1 คน จองได้หลาย Booking
    @OneToMany(mappedBy = "user")
    private List<Booking> bookings;

    // Getters and Setters...
}