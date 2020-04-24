extern crate clap;
extern crate dotenv;

use clap::{App, Arg};
use dotenv::dotenv;

mod concat;
mod segment;

fn main() {
  dotenv().ok();

  let matches = App::new("Tidal Distributed Video Transcoder")
    .version("0.1.0")
    .author("Brendan Kennedy <brenwken@gmail.com>")
    .about("fast video transcoder written in rust")
    .arg(Arg::with_name("mode").index(1).required(true))
    .arg(Arg::with_name("in").index(2).required(true))
    .arg(Arg::with_name("out").index(3).required(true))
    .arg(
      Arg::with_name("transcode_queue_url")
        .takes_value(true)
        .long("transcodeQueueUrl"),
    )
    .get_matches();

  let mode = matches.value_of("mode");
  let arg_in = &matches.value_of("in").unwrap();
  let arg_out = &matches.value_of("out").unwrap();

  match mode {
    Some("segment") => {
      println!("Segmentation Mode");
      segment::run(arg_in, arg_out)
    }
    Some("concat") => concat::run(matches),
    _ => println!("invalid mode: {}", mode.unwrap()),
  }
}
