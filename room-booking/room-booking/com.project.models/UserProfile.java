@Entity
public class UserProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String lastName;
    private String telephone;

    // --- One-to-One ---
    // นี่คือฝั่งที่เป็นเจ้าของ Foreign Key (user_id)
    @OneToOne
    @JoinColumn(name = "user_id") // สร้างคอลัมน์ user_id
    private User user;

    // Getters and Setters...
}