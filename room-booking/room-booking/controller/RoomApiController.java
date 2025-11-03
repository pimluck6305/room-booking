@RestController
@RequestMapping("/api") // API ทั้งหมดจะขึ้นต้นด้วย /api
public class RoomApiController {

    @Autowired
    private RoomRepository roomRepository; // Spring จะ inject มาให้เอง

    // API สำหรับดึงรายชื่อห้องทั้งหมด
    @GetMapping("/rooms")
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    // API สำหรับดึงข้อมูลห้องเดียว
    @GetMapping("/rooms/{id}")
    public Room getRoomById(@PathVariable Long id) {
        return roomRepository.findById(id).orElse(null);
    }

    // API สำหรับสร้างการจอง (ตัวอย่าง)
    @PostMapping("/bookings")
    public String createBooking(@RequestBody Booking newBooking) {
        // (ในความเป็นจริง logic ควรซับซ้อนกว่านี้ เช่น เช็คว่าห้องว่างไหม)
        // bookingRepository.save(newBooking);
        return "Booking created!";
    }
}