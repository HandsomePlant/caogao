import random
import tkinter as tk

CELL_SIZE = 20
GRID_WIDTH = 30
GRID_HEIGHT = 20
INITIAL_SPEED_MS = 120


class SnakeGame:
    def __init__(self, master: tk.Tk) -> None:
        self.master = master
        self.master.title("贪吃蛇")

        self.canvas = tk.Canvas(
            master,
            width=GRID_WIDTH * CELL_SIZE,
            height=GRID_HEIGHT * CELL_SIZE,
            bg="#1e1e1e",
            highlightthickness=0,
        )
        self.canvas.pack()

        self.info_label = tk.Label(
            master,
            text="分数: 0    空格键暂停/继续",
            font=("Arial", 12),
            padx=6,
            pady=6,
        )
        self.info_label.pack()

        self.reset()
        self.bind_keys()
        self.game_loop()

    def reset(self) -> None:
        cx = GRID_WIDTH // 2
        cy = GRID_HEIGHT // 2
        self.snake = [(cx, cy), (cx - 1, cy), (cx - 2, cy)]
        self.direction = (1, 0)
        self.next_direction = (1, 0)
        self.food = self.random_food_position()
        self.score = 0
        self.running = True
        self.game_over = False

    def bind_keys(self) -> None:
        self.master.bind("<Up>", lambda _e: self.set_direction(0, -1))
        self.master.bind("<Down>", lambda _e: self.set_direction(0, 1))
        self.master.bind("<Left>", lambda _e: self.set_direction(-1, 0))
        self.master.bind("<Right>", lambda _e: self.set_direction(1, 0))
        self.master.bind("<space>", lambda _e: self.toggle_pause())
        self.master.bind("r", lambda _e: self.restart())
        self.master.bind("R", lambda _e: self.restart())

    def set_direction(self, dx: int, dy: int) -> None:
        if self.game_over or not self.running:
            return

        current_dx, current_dy = self.direction
        if (dx, dy) == (-current_dx, -current_dy):
            return
        self.next_direction = (dx, dy)

    def toggle_pause(self) -> None:
        if self.game_over:
            return
        self.running = not self.running
        if not self.running:
            self.info_label.config(text=f"分数: {self.score}    已暂停(空格继续)")
        else:
            self.info_label.config(text=f"分数: {self.score}    空格键暂停/继续")
            self.game_loop()

    def restart(self) -> None:
        self.reset()
        self.info_label.config(text="分数: 0    空格键暂停/继续")
        self.draw()
        self.game_loop()

    def random_food_position(self) -> tuple[int, int]:
        free_cells = {
            (x, y)
            for x in range(GRID_WIDTH)
            for y in range(GRID_HEIGHT)
            if (x, y) not in self.snake
        }
        return random.choice(list(free_cells))

    def move_snake(self) -> None:
        self.direction = self.next_direction
        head_x, head_y = self.snake[0]
        dx, dy = self.direction
        new_head = (head_x + dx, head_y + dy)

        if (
            new_head[0] < 0
            or new_head[0] >= GRID_WIDTH
            or new_head[1] < 0
            or new_head[1] >= GRID_HEIGHT
            or new_head in self.snake
        ):
            self.game_over = True
            self.running = False
            return

        self.snake.insert(0, new_head)

        if new_head == self.food:
            self.score += 1
            self.food = self.random_food_position()
        else:
            self.snake.pop()

    def draw(self) -> None:
        self.canvas.delete("all")

        # 绘制网格背景（可注释掉以提升性能）
        for x in range(0, GRID_WIDTH * CELL_SIZE, CELL_SIZE):
            self.canvas.create_line(x, 0, x, GRID_HEIGHT * CELL_SIZE, fill="#2b2b2b")
        for y in range(0, GRID_HEIGHT * CELL_SIZE, CELL_SIZE):
            self.canvas.create_line(0, y, GRID_WIDTH * CELL_SIZE, y, fill="#2b2b2b")

        # 食物
        fx, fy = self.food
        self.draw_cell(fx, fy, "#ff5c5c")

        # 蛇
        for i, (x, y) in enumerate(self.snake):
            color = "#7CFC00" if i == 0 else "#32CD32"
            self.draw_cell(x, y, color)

        if self.game_over:
            self.canvas.create_text(
                GRID_WIDTH * CELL_SIZE // 2,
                GRID_HEIGHT * CELL_SIZE // 2,
                text="游戏结束\n按 R 重新开始",
                fill="white",
                font=("Arial", 24, "bold"),
                justify="center",
            )
            self.info_label.config(text=f"最终分数: {self.score}    按 R 重开")
        else:
            self.info_label.config(text=f"分数: {self.score}    空格键暂停/继续")

    def draw_cell(self, x: int, y: int, color: str) -> None:
        x1 = x * CELL_SIZE
        y1 = y * CELL_SIZE
        x2 = x1 + CELL_SIZE
        y2 = y1 + CELL_SIZE
        self.canvas.create_rectangle(x1 + 1, y1 + 1, x2 - 1, y2 - 1, fill=color, outline="")

    def game_loop(self) -> None:
        if self.running and not self.game_over:
            self.move_snake()
            self.draw()
            self.master.after(INITIAL_SPEED_MS, self.game_loop)
        elif self.game_over:
            self.draw()


def main() -> None:
    root = tk.Tk()
    SnakeGame(root)
    root.mainloop()


if __name__ == "__main__":
    main()
