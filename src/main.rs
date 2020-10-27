use std::env;

struct X264Args {}

fn main() {
    let args: Vec<String> = env::args().collect();
    let url = &args[1];

    println!("url: {}", url);

    // ffmpeg get metadata

    // create presets

    // return json
}
