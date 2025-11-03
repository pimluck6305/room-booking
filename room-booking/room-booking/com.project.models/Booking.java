@Entity
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    // --- Many-to-One (ฝั่งลูกของ One-to-Many) ---
    @ManyToOne
    @JoinColumn(name = "user_id") // สร้างคอลัมน์ user_id
    private User user;

    // --- Many-to-One ---
    @ManyToOne
    @JoinColumn(name = "room_id") // สร้างคอลัมน์ room_id
    private Room room;

    // Getters and Setters...
}